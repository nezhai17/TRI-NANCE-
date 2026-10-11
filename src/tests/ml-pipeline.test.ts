import { describe, it, expect } from 'vitest';
import { DatasetManager } from '../lib/ml/dataset-manager';
import { TfIdfVectorizer } from '../lib/ml/vectorizer';
import {
  MultinomialNaiveBayes,
  ComplementNaiveBayes,
  LogisticRegressionClassifier,
  LinearSVCClassifier,
} from '../lib/ml/classifiers';
import { ModelEvaluator } from '../lib/ml/evaluator';
import { ModelTrainer } from '../lib/ml/trainer';
import { ModelRegistry, MLInferenceEngine } from '../lib/ml/model-registry';

describe('ML Pipeline & Zero-Leakage Guarantees', () => {
  it('loads and splits sentiment dataset without leakage or missing records', () => {
    const items = DatasetManager.loadDataset('sentiment_classification');
    expect(items.length).toBeGreaterThanOrEqual(20);

    const split = DatasetManager.createSplit('sentiment_classification', items, 0.7, 0.15, 42);

    expect(split.train.length).toBeGreaterThan(0);
    expect(split.validation.length).toBeGreaterThan(0);
    expect(split.test.length).toBeGreaterThan(0);

    // Verify disjoint sets: zero leakage between train, validation, and test
    const trainIds = new Set(split.train.map((x) => x.id));
    const valIds = new Set(split.validation.map((x) => x.id));
    const testIds = new Set(split.test.map((x) => x.id));

    split.validation.forEach((v) => expect(trainIds.has(v.id)).toBe(false));
    split.test.forEach((t) => {
      expect(trainIds.has(t.id)).toBe(false);
      expect(valIds.has(t.id)).toBe(false);
    });

    expect(split.train.length + split.validation.length + split.test.length).toBe(items.length);
  });

  it('TF-IDF vectorizer extracts unigrams and bigrams and ignores test terms', () => {
    const trainDocs = [
      'revenue grew by 20 percent',
      'operating profit expanded',
      'cash reserves remain high',
    ];
    const vectorizer = new TfIdfVectorizer({ ngramRange: [1, 2] });
    vectorizer.fit(trainDocs);

    expect(vectorizer.isFitted).toBe(true);
    expect(Object.keys(vectorizer.vocabulary).length).toBeGreaterThan(0);

    // Transform train doc
    const vecTrain = vectorizer.transform('revenue grew by 20 percent');
    expect(vecTrain.length).toBe(Object.keys(vectorizer.vocabulary).length);

    // Euclidean L2 norm check
    const norm = Math.sqrt(vecTrain.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 3);

    // Transform unseen text with unlearned terms
    const vecUnseen = vectorizer.transform('unseen cryptocurrency liquidation completely alien terms');
    expect(vecUnseen.length).toBe(vecTrain.length);
  });

  it('Multinomial and Complement Naive Bayes train and produce valid probability distributions', () => {
    const X = [
      [1, 0, 0],
      [0.9, 0.1, 0],
      [0, 1, 0.2],
      [0, 0.8, 0.5],
    ];
    const y = ['positive', 'positive', 'negative', 'negative'];

    const mnb = new MultinomialNaiveBayes();
    mnb.fit(X, y);
    expect(mnb.isFitted).toBe(true);

    const probas = mnb.predictProba([1, 0, 0]);
    expect(probas.positive).toBeGreaterThan(probas.negative);
    expect(probas.positive + probas.negative).toBeCloseTo(1.0, 4);

    const cnb = new ComplementNaiveBayes();
    cnb.fit(X, y);
    expect(cnb.isFitted).toBe(true);
    const cnbProbas = cnb.predictProba([0, 1, 0.3]);
    expect(cnbProbas.negative).toBeGreaterThan(cnbProbas.positive);
  });

  it('Logistic Regression and Linear SVC train and correctly predict margins', () => {
    const X = [
      [1.0, 0.0],
      [0.9, 0.1],
      [0.0, 1.0],
      [0.1, 0.9],
    ];
    const y = ['growth', 'growth', 'loss', 'loss'];

    const lr = new LogisticRegressionClassifier(0.1, 0.001, 50);
    lr.fit(X, y);
    const predLr = lr.predict([[1.0, 0.0], [0.0, 1.0]]);
    expect(predLr).toEqual(['growth', 'loss']);

    const svc = new LinearSVCClassifier(1.0, 50);
    svc.fit(X, y);
    const predSvc = svc.predict([[1.0, 0.0], [0.0, 1.0]]);
    expect(predSvc).toEqual(['growth', 'loss']);
  });

  it('ModelEvaluator computes honest precision, recall, macro F1, and confusion matrix', () => {
    const actual = ['positive', 'negative', 'positive', 'neutral', 'negative'];
    const predicted = ['positive', 'negative', 'neutral', 'neutral', 'negative'];

    const metrics = ModelEvaluator.evaluate(actual, predicted);
    expect(metrics.accuracy).toBe(0.8);
    expect(metrics.macroF1).toBeGreaterThan(0.5);
    expect(metrics.confusionMatrix.matrix.length).toBe(3);
    expect(metrics.perClass['negative'].recall).toBe(1.0);
  });

  it('runs complete ModelTrainer training pipeline and produces benchmark report', async () => {
    const report = await ModelTrainer.runTrainingPipeline('sentiment_classification');

    expect(report.status).toBe('completed');
    expect(report.benchmarks.length).toBe(4);
    expect(report.winningAlgorithm).toBeDefined();
    expect(report.registeredModelId).toBeDefined();

    const artifact = ModelTrainer.loadArtifact(report.registeredModelId);
    expect(artifact).not.toBeNull();
    expect(artifact?.metrics.macroF1).toBeGreaterThan(0);

    // Register model and verify active deployment
    const entry = ModelRegistry.registerModel(report.registeredModelId, 'active_production');
    expect(entry.state).toBe('active_production');

    const activeModel = ModelRegistry.getActiveModel('sentiment_classification');
    expect(activeModel?.id).toBe(report.registeredModelId);

    // Run live ML inference
    const inference = MLInferenceEngine.predict(
      'sentiment_classification',
      'The company achieved outstanding record profitability and dividend growth.'
    );

    expect(inference).not.toBeNull();
    expect(inference?.probabilities).toBeDefined();
    expect(inference?.confidence).toBeGreaterThan(0);
    expect(inference?.featureWeights && inference.featureWeights.length).toBeGreaterThan(0);
  });
});
