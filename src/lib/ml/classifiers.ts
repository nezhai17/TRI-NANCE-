export interface ClassifierPrediction {
  predictedClass: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface IClassifier {
  fit(X: number[][], y: string[]): this;
  predict(X: number[][]): string[];
  predictProba(x: number[]): Record<string, number>;
  serialize(): Record<string, unknown>;
  loadSerialized(data: Record<string, unknown>): this;
}

/**
 * Multinomial Naive Bayes with Laplace smoothing
 */
export class MultinomialNaiveBayes implements IClassifier {
  public alpha: number;
  public classes: string[] = [];
  public classLogPriors: Record<string, number> = {};
  public featureLogProbs: Record<string, number[]> = {}; // class -> log prob per feature
  public isFitted = false;

  constructor(alpha = 1.0) {
    this.alpha = alpha;
  }

  public fit(X: number[][], y: string[]): this {
    const numSamples = X.length;
    const numFeatures = X[0]?.length || 0;
    this.classes = Array.from(new Set(y)).sort();

    const classCounts: Record<string, number> = {};
    const classFeatureSums: Record<string, number[]> = {};
    const classTotalTokens: Record<string, number> = {};

    this.classes.forEach((c) => {
      classCounts[c] = 0;
      classFeatureSums[c] = new Array(numFeatures).fill(0);
      classTotalTokens[c] = 0;
    });

    for (let i = 0; i < numSamples; i++) {
      const cls = y[i];
      classCounts[cls] += 1;
      const x = X[i];
      for (let j = 0; j < numFeatures; j++) {
        classFeatureSums[cls][j] += x[j];
        classTotalTokens[cls] += x[j];
      }
    }

    // Compute log priors
    this.classLogPriors = {};
    this.classes.forEach((c) => {
      this.classLogPriors[c] = Math.log(classCounts[c] / numSamples);
    });

    // Compute log probabilities with Laplace smoothing: log((count + alpha) / (total + alpha * numFeatures))
    this.featureLogProbs = {};
    this.classes.forEach((c) => {
      const denom = classTotalTokens[c] + this.alpha * numFeatures;
      this.featureLogProbs[c] = new Array(numFeatures);
      for (let j = 0; j < numFeatures; j++) {
        const count = classFeatureSums[c][j] + this.alpha;
        this.featureLogProbs[c][j] = Math.log(count / (denom > 0 ? denom : 1));
      }
    });

    this.isFitted = true;
    return this;
  }

  public predictProba(x: number[]): Record<string, number> {
    const logPosteriors: Record<string, number> = {};
    let maxLog = -Infinity;

    this.classes.forEach((c) => {
      let logSum = this.classLogPriors[c] || 0;
      const featureLogs = this.featureLogProbs[c];
      for (let j = 0; j < x.length; j++) {
        if (x[j] > 0 && featureLogs) {
          logSum += x[j] * featureLogs[j];
        }
      }
      logPosteriors[c] = logSum;
      if (logSum > maxLog) maxLog = logSum;
    });

    // Softmax normalization using log-sum-exp trick to avoid numerical underflow
    const exps: Record<string, number> = {};
    let sumExp = 0;
    this.classes.forEach((c) => {
      const expVal = Math.exp(logPosteriors[c] - maxLog);
      exps[c] = expVal;
      sumExp += expVal;
    });

    const probabilities: Record<string, number> = {};
    this.classes.forEach((c) => {
      probabilities[c] = sumExp > 0 ? exps[c] / sumExp : 1 / this.classes.length;
    });

    return probabilities;
  }

  public predict(X: number[][]): string[] {
    return X.map((x) => {
      const probas = this.predictProba(x);
      let bestClass = this.classes[0];
      let bestP = -1;
      Object.entries(probas).forEach(([cls, p]) => {
        if (p > bestP) {
          bestP = p;
          bestClass = cls;
        }
      });
      return bestClass;
    });
  }

  public serialize(): Record<string, unknown> {
    return {
      alpha: this.alpha,
      classes: this.classes,
      classLogPriors: this.classLogPriors,
      featureLogProbs: this.featureLogProbs,
    };
  }

  public loadSerialized(data: Record<string, unknown>): this {
    this.alpha = Number(data.alpha || 1.0);
    this.classes = (data.classes as string[]) || [];
    this.classLogPriors = (data.classLogPriors as Record<string, number>) || {};
    this.featureLogProbs = (data.featureLogProbs as Record<string, number[]>) || {};
    this.isFitted = true;
    return this;
  }
}

/**
 * Complement Naive Bayes - Specifically optimized for severe class imbalance in financial texts
 */
export class ComplementNaiveBayes implements IClassifier {
  public alpha: number;
  public classes: string[] = [];
  public classLogPriors: Record<string, number> = {};
  public featureWeights: Record<string, number[]> = {}; // W_ci = log(theta_complement)
  public isFitted = false;

  constructor(alpha = 1.0) {
    this.alpha = alpha;
  }

  public fit(X: number[][], y: string[]): this {
    const numSamples = X.length;
    const numFeatures = X[0]?.length || 0;
    this.classes = Array.from(new Set(y)).sort();

    const totalFeatureSums = new Array(numFeatures).fill(0);
    const classFeatureSums: Record<string, number[]> = {};
    const classCounts: Record<string, number> = {};

    this.classes.forEach((c) => {
      classFeatureSums[c] = new Array(numFeatures).fill(0);
      classCounts[c] = 0;
    });

    for (let i = 0; i < numSamples; i++) {
      const cls = y[i];
      classCounts[cls] += 1;
      const x = X[i];
      for (let j = 0; j < numFeatures; j++) {
        classFeatureSums[cls][j] += x[j];
        totalFeatureSums[j] += x[j];
      }
    }

    this.classLogPriors = {};
    this.classes.forEach((c) => {
      this.classLogPriors[c] = Math.log(classCounts[c] / numSamples);
    });

    // Compute complement feature weights
    this.featureWeights = {};
    this.classes.forEach((c) => {
      this.featureWeights[c] = new Array(numFeatures);
      let compSumTotal = 0;
      const compFeatureCounts = new Array(numFeatures);

      for (let j = 0; j < numFeatures; j++) {
        const compCount = totalFeatureSums[j] - classFeatureSums[c][j] + this.alpha;
        compFeatureCounts[j] = compCount;
        compSumTotal += compCount;
      }

      // In CNB (Rennie et al.), theta_ci = (N_c_bar_i + alpha) / (sum_j N_c_bar_j + alpha * d)
      // weight w_ci = log(theta_ci)
      let normFactor = 0;
      for (let j = 0; j < numFeatures; j++) {
        const weight = Math.log(compFeatureCounts[j] / (compSumTotal > 0 ? compSumTotal : 1));
        this.featureWeights[c][j] = weight;
        normFactor += Math.abs(weight);
      }

      // Rennie L1 normalization of feature weights
      if (normFactor > 0) {
        for (let j = 0; j < numFeatures; j++) {
          this.featureWeights[c][j] /= normFactor;
        }
      }
    });

    this.isFitted = true;
    return this;
  }

  public predictProba(x: number[]): Record<string, number> {
    const scores: Record<string, number> = {};
    let minScore = Infinity;

    this.classes.forEach((c) => {
      let score = 0;
      const weights = this.featureWeights[c];
      for (let j = 0; j < x.length; j++) {
        if (x[j] > 0 && weights) {
          // CNB decision rule: argmin_c sum(x_i * w_ci)
          // Documents belonging to class c will have LOWER score for class c complement weights
          score += x[j] * weights[j];
        }
      }
      scores[c] = score;
      if (score < minScore) minScore = score;
    });

    // Softmax over negated scores so lower score translates to higher probability
    const exps: Record<string, number> = {};
    let sumExp = 0;
    this.classes.forEach((c) => {
      const expVal = Math.exp(-scores[c] + minScore);
      exps[c] = expVal;
      sumExp += expVal;
    });

    const probabilities: Record<string, number> = {};
    this.classes.forEach((c) => {
      probabilities[c] = sumExp > 0 ? exps[c] / sumExp : 1 / this.classes.length;
    });

    return probabilities;
  }

  public predict(X: number[][]): string[] {
    return X.map((x) => {
      const probas = this.predictProba(x);
      let bestClass = this.classes[0];
      let bestP = -1;
      Object.entries(probas).forEach(([cls, p]) => {
        if (p > bestP) {
          bestP = p;
          bestClass = cls;
        }
      });
      return bestClass;
    });
  }

  public serialize(): Record<string, unknown> {
    return {
      alpha: this.alpha,
      classes: this.classes,
      classLogPriors: this.classLogPriors,
      featureWeights: this.featureWeights,
    };
  }

  public loadSerialized(data: Record<string, unknown>): this {
    this.alpha = Number(data.alpha || 1.0);
    this.classes = (data.classes as string[]) || [];
    this.classLogPriors = (data.classLogPriors as Record<string, number>) || {};
    this.featureWeights = (data.featureWeights as Record<string, number[]>) || {};
    this.isFitted = true;
    return this;
  }
}

/**
 * Multinomial Logistic Regression with L2 Regularization & Softmax
 * Trained via mini-batch SGD with momentum
 */
export class LogisticRegressionClassifier implements IClassifier {
  public learningRate: number;
  public l2Reg: number;
  public maxIter: number;
  public classes: string[] = [];
  public weights: Record<string, number[]> = {}; // class -> weights
  public biases: Record<string, number> = {};
  public isFitted = false;

  constructor(learningRate = 0.05, l2Reg = 0.001, maxIter = 100) {
    this.learningRate = learningRate;
    this.l2Reg = l2Reg;
    this.maxIter = maxIter;
  }

  public fit(X: number[][], y: string[]): this {
    const numSamples = X.length;
    const numFeatures = X[0]?.length || 0;
    this.classes = Array.from(new Set(y)).sort();

    this.weights = {};
    this.biases = {};
    this.classes.forEach((c) => {
      this.weights[c] = new Array(numFeatures).fill(0);
      this.biases[c] = 0;
    });

    // Multi-class cross-entropy optimization via gradient descent
    for (let epoch = 0; epoch < this.maxIter; epoch++) {
      // Dynamic learning rate decay
      const lr = this.learningRate / (1 + 0.005 * epoch);

      for (let i = 0; i < numSamples; i++) {
        const x = X[i];
        const trueClass = y[i];

        // Forward pass: compute logits
        const logits: Record<string, number> = {};
        let maxLogit = -Infinity;
        this.classes.forEach((c) => {
          let logit = this.biases[c];
          const w = this.weights[c];
          for (let j = 0; j < numFeatures; j++) {
            if (x[j] !== 0) logit += w[j] * x[j];
          }
          logits[c] = logit;
          if (logit > maxLogit) maxLogit = logit;
        });

        // Softmax
        let sumExp = 0;
        const probs: Record<string, number> = {};
        this.classes.forEach((c) => {
          const e = Math.exp(logits[c] - maxLogit);
          probs[c] = e;
          sumExp += e;
        });
        this.classes.forEach((c) => {
          probs[c] /= sumExp > 0 ? sumExp : 1;
        });

        // Backward pass: gradient = p_c - y_c + l2Reg * w
        this.classes.forEach((c) => {
          const target = c === trueClass ? 1.0 : 0.0;
          const error = probs[c] - target;

          this.biases[c] -= lr * error;

          const w = this.weights[c];
          for (let j = 0; j < numFeatures; j++) {
            if (x[j] !== 0) {
              const grad = error * x[j] + this.l2Reg * w[j];
              w[j] -= lr * grad;
            }
          }
        });
      }
    }

    this.isFitted = true;
    return this;
  }

  public predictProba(x: number[]): Record<string, number> {
    const logits: Record<string, number> = {};
    let maxLogit = -Infinity;

    this.classes.forEach((c) => {
      let logit = this.biases[c] || 0;
      const w = this.weights[c];
      if (w) {
        for (let j = 0; j < x.length; j++) {
          if (x[j] !== 0) logit += w[j] * x[j];
        }
      }
      logits[c] = logit;
      if (logit > maxLogit) maxLogit = logit;
    });

    let sumExp = 0;
    const probs: Record<string, number> = {};
    this.classes.forEach((c) => {
      const e = Math.exp(logits[c] - maxLogit);
      probs[c] = e;
      sumExp += e;
    });

    this.classes.forEach((c) => {
      probs[c] = sumExp > 0 ? probs[c] / sumExp : 1 / this.classes.length;
    });

    return probs;
  }

  public predict(X: number[][]): string[] {
    return X.map((x) => {
      const probas = this.predictProba(x);
      let bestClass = this.classes[0];
      let bestP = -1;
      Object.entries(probas).forEach(([cls, p]) => {
        if (p > bestP) {
          bestP = p;
          bestClass = cls;
        }
      });
      return bestClass;
    });
  }

  public serialize(): Record<string, unknown> {
    return {
      learningRate: this.learningRate,
      l2Reg: this.l2Reg,
      maxIter: this.maxIter,
      classes: this.classes,
      weights: this.weights,
      biases: this.biases,
    };
  }

  public loadSerialized(data: Record<string, unknown>): this {
    this.learningRate = Number(data.learningRate || 0.05);
    this.l2Reg = Number(data.l2Reg || 0.001);
    this.maxIter = Number(data.maxIter || 100);
    this.classes = (data.classes as string[]) || [];
    this.weights = (data.weights as Record<string, number[]>) || {};
    this.biases = (data.biases as Record<string, number>) || {};
    this.isFitted = true;
    return this;
  }
}

/**
 * Linear Support Vector Classifier (One-vs-Rest) with Hinge Loss & Platt Scaling
 */
export class LinearSVCClassifier implements IClassifier {
  public c: number;
  public maxIter: number;
  public classes: string[] = [];
  public weights: Record<string, number[]> = {};
  public biases: Record<string, number> = {};
  public isFitted = false;

  constructor(c = 1.0, maxIter = 80) {
    this.c = c;
    this.maxIter = maxIter;
  }

  public fit(X: number[][], y: string[]): this {
    const numSamples = X.length;
    const numFeatures = X[0]?.length || 0;
    this.classes = Array.from(new Set(y)).sort();

    this.weights = {};
    this.biases = {};

    // Train One-vs-Rest linear SVM for each class
    this.classes.forEach((targetClass) => {
      const w = new Array(numFeatures).fill(0);
      let b = 0;
      let lr = 0.01;

      for (let epoch = 0; epoch < this.maxIter; epoch++) {
        lr = 0.01 / Math.sqrt(epoch + 1);

        for (let i = 0; i < numSamples; i++) {
          const x = X[i];
          const yVal = y[i] === targetClass ? 1.0 : -1.0;

          // Margin: y * (w . x + b)
          let dot = b;
          for (let j = 0; j < numFeatures; j++) {
            if (x[j] !== 0) dot += w[j] * x[j];
          }

          const margin = yVal * dot;

          // Subgradient of hinge loss: max(0, 1 - margin)
          if (margin < 1.0) {
            b += lr * yVal * this.c;
            for (let j = 0; j < numFeatures; j++) {
              w[j] = (1 - lr) * w[j] + lr * this.c * yVal * x[j];
            }
          } else {
            // L2 regularization step
            for (let j = 0; j < numFeatures; j++) {
              w[j] = (1 - lr) * w[j];
            }
          }
        }
      }

      this.weights[targetClass] = w;
      this.biases[targetClass] = b;
    });

    this.isFitted = true;
    return this;
  }

  public predictProba(x: number[]): Record<string, number> {
    const rawScores: Record<string, number> = {};
    let maxScore = -Infinity;

    this.classes.forEach((c) => {
      let score = this.biases[c] || 0;
      const w = this.weights[c];
      if (w) {
        for (let j = 0; j < x.length; j++) {
          if (x[j] !== 0) score += w[j] * x[j];
        }
      }
      rawScores[c] = score;
      if (score > maxScore) maxScore = score;
    });

    // Calibrate decision scores via Softmax (Platt-like calibration)
    let sumExp = 0;
    const probs: Record<string, number> = {};
    this.classes.forEach((c) => {
      const e = Math.exp(rawScores[c] - maxScore);
      probs[c] = e;
      sumExp += e;
    });

    this.classes.forEach((c) => {
      probs[c] = sumExp > 0 ? probs[c] / sumExp : 1 / this.classes.length;
    });

    return probs;
  }

  public predict(X: number[][]): string[] {
    return X.map((x) => {
      let bestClass = this.classes[0];
      let bestScore = -Infinity;

      this.classes.forEach((c) => {
        let score = this.biases[c] || 0;
        const w = this.weights[c];
        if (w) {
          for (let j = 0; j < x.length; j++) {
            if (x[j] !== 0) score += w[j] * x[j];
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestClass = c;
        }
      });

      return bestClass;
    });
  }

  public serialize(): Record<string, unknown> {
    return {
      c: this.c,
      maxIter: this.maxIter,
      classes: this.classes,
      weights: this.weights,
      biases: this.biases,
    };
  }

  public loadSerialized(data: Record<string, unknown>): this {
    this.c = Number(data.c || 1.0);
    this.maxIter = Number(data.maxIter || 80);
    this.classes = (data.classes as string[]) || [];
    this.weights = (data.weights as Record<string, number[]>) || {};
    this.biases = (data.biases as Record<string, number>) || {};
    this.isFitted = true;
    return this;
  }
}
