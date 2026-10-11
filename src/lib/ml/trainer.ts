import {
  MLTaskType,
  MLAlgorithm,
  ModelArtifact,
  AlgorithmBenchmark,
  TrainingRunReport,
} from '../types';
import { DatasetManager } from './dataset-manager';
import { TfIdfVectorizer, DEFAULT_VECTORIZER_CONFIG } from './vectorizer';
import {
  MultinomialNaiveBayes,
  ComplementNaiveBayes,
  LogisticRegressionClassifier,
  LinearSVCClassifier,
  IClassifier,
} from './classifiers';
import { ModelEvaluator } from './evaluator';
import fs from 'fs';
import path from 'path';

const MODELS_DIR = path.join(process.cwd(), '.data', 'models');

export class ModelTrainer {
  private static ensureDirExists() {
    if (!fs.existsSync(MODELS_DIR)) {
      fs.mkdirSync(MODELS_DIR, { recursive: true });
    }
  }

  public static getArtifactPath(modelId: string): string {
    this.ensureDirExists();
    return path.join(MODELS_DIR, `${modelId}.json`);
  }

  public static loadArtifact(modelId: string): ModelArtifact | null {
    const filePath = this.getArtifactPath(modelId);
    if (!fs.existsSync(filePath)) return null;
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ModelArtifact;
    } catch {
      return null;
    }
  }

  public static saveArtifact(artifact: ModelArtifact): void {
    this.ensureDirExists();
    const filePath = this.getArtifactPath(artifact.id);
    fs.writeFileSync(filePath, JSON.stringify(artifact, null, 2), 'utf-8');
  }

  /**
   * Run full multi-algorithm training & benchmarking pipeline:
   * 1. Loads dataset and performs stratified 70/15/15 train/val/test split.
   * 2. Fits TF-IDF vectorizer STRICTLY on train split.
   * 3. Fits Multinomial NB, Complement NB, Logistic Regression, Linear SVC on train split.
   * 4. Benchmarks each algorithm on validation split (without peeking at test split).
   * 5. Selects winning algorithm based on validation Macro F1.
   * 6. Evaluates winner on untouched test split for honest production metrics.
   * 7. Saves model artifact and returns detailed run report.
   */
  public static async runTrainingPipeline(task: MLTaskType): Promise<TrainingRunReport> {
    const runId = `run-${task}-${Date.now()}`;
    const allItems = DatasetManager.loadDataset(task);

    if (allItems.length < 6) {
      throw new Error(`Insufficient samples to train ML model for task ${task}. Found ${allItems.length}`);
    }

    // Zero-leakage stratified train / val / test split
    const split = DatasetManager.createSplit(task, allItems, 0.7, 0.15, 42);

    const trainDocs = split.train.map((d) => d.text);
    const trainLabels = split.train.map((d) =>
      task === 'sentiment_classification'
        ? d.sentimentLabel || 'neutral'
        : (d.riskLabels && d.riskLabels[0]) || 'liquidity_cash_flow'
    );

    const valDocs = split.validation.map((d) => d.text);
    const valLabels = split.validation.map((d) =>
      task === 'sentiment_classification'
        ? d.sentimentLabel || 'neutral'
        : (d.riskLabels && d.riskLabels[0]) || 'liquidity_cash_flow'
    );

    const testDocs = split.test.map((d) => d.text);
    const testLabels = split.test.map((d) =>
      task === 'sentiment_classification'
        ? d.sentimentLabel || 'neutral'
        : (d.riskLabels && d.riskLabels[0]) || 'liquidity_cash_flow'
    );

    // FIT TF-IDF STRICTLY ON TRAIN SPLIT ONLY
    const vectorizer = new TfIdfVectorizer(DEFAULT_VECTORIZER_CONFIG);
    vectorizer.fit(trainDocs);

    const X_train = trainDocs.map((doc) => vectorizer.transform(doc));
    const X_val = valDocs.map((doc) => vectorizer.transform(doc));
    const X_test = testDocs.map((doc) => vectorizer.transform(doc));

    // Algorithm candidates to benchmark
    const candidates: Array<{
      algorithm: MLAlgorithm;
      label: string;
      createModel: () => IClassifier;
    }> = [
      {
        algorithm: 'multinomial_naive_bayes',
        label: 'Multinomial Naive Bayes (Laplace α=1.0)',
        createModel: () => new MultinomialNaiveBayes(1.0),
      },
      {
        algorithm: 'complement_naive_bayes',
        label: 'Complement Naive Bayes (Imbalance-Weighted)',
        createModel: () => new ComplementNaiveBayes(1.0),
      },
      {
        algorithm: 'logistic_regression',
        label: 'L2-Regularized Logistic Regression (SGD Softmax)',
        createModel: () => new LogisticRegressionClassifier(0.08, 0.001, 120),
      },
      {
        algorithm: 'linear_svc',
        label: 'Linear Support Vector Classifier (Hinge Loss C=1.0)',
        createModel: () => new LinearSVCClassifier(1.0, 90),
      },
    ];

    const benchmarks: AlgorithmBenchmark[] = [];
    const trainedModels: Record<MLAlgorithm, IClassifier> = {} as any;

    for (const cand of candidates) {
      const startTime = Date.now();
      const model = cand.createModel();
      model.fit(X_train, trainLabels);
      const duration = Date.now() - startTime;
      trainedModels[cand.algorithm] = model;

      // Predict on validation set
      const valPreds = model.predict(X_val);
      const valProbas = X_val.map((x) => model.predictProba(x));

      const valMetrics = ModelEvaluator.evaluate(valLabels, valPreds, valProbas);

      benchmarks.push({
        algorithm: cand.algorithm,
        algorithmLabel: cand.label,
        validationMacroF1: valMetrics.macroF1,
        validationAccuracy: valMetrics.accuracy,
        trainingDurationMs: Math.max(1, duration),
        metrics: valMetrics,
        isBestCandidate: false,
      });
    }

    // Select winner by Validation Macro F1
    benchmarks.sort((a, b) => {
      if (b.validationMacroF1 !== a.validationMacroF1) {
        return b.validationMacroF1 - a.validationMacroF1;
      }
      return b.validationAccuracy - a.validationAccuracy;
    });

    benchmarks[0].isBestCandidate = true;
    const winner = benchmarks[0];
    const winningModel = trainedModels[winner.algorithm];

    // Evaluate winning model on the UNTOUCHED TEST SPLIT
    const testPreds = winningModel.predict(X_test);
    const testProbas = X_test.map((x) => winningModel.predictProba(x));
    const testMetrics = ModelEvaluator.evaluate(testLabels, testPreds, testProbas);

    // Build and serialize model artifact
    const version = `v${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}-${Date.now().toString(36).slice(-4)}`;
    const modelId = `model-${task}-${winner.algorithm}-${version}`;

    const artifact: ModelArtifact = {
      id: modelId,
      version,
      name: `TriNance ${winner.algorithmLabel} (${task})`,
      task,
      algorithm: winner.algorithm,
      hyperparameters: {
        ngramRange: DEFAULT_VECTORIZER_CONFIG.ngramRange,
        minDf: DEFAULT_VECTORIZER_CONFIG.minDf,
        maxFeatures: DEFAULT_VECTORIZER_CONFIG.maxFeatures,
        sublinearTf: DEFAULT_VECTORIZER_CONFIG.sublinearTf,
      },
      vocabulary: vectorizer.vocabulary,
      idfWeights: vectorizer.idfWeights,
      weights: winningModel.serialize() as any,
      classes: winningModel.serialize().classes as string[],
      metrics: testMetrics,
      createdAt: new Date().toISOString(),
      trainingDurationMs: winner.trainingDurationMs,
    };

    this.saveArtifact(artifact);

    return {
      runId,
      task,
      timestamp: new Date().toISOString(),
      datasetSize: {
        train: split.train.length,
        validation: split.validation.length,
        test: split.test.length,
        total: allItems.length,
      },
      benchmarks,
      winningAlgorithm: winner.algorithm,
      registeredModelId: modelId,
      registeredVersion: version,
      status: 'completed',
    };
  }
}
