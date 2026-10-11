import {
  ModelRegistryEntry,
  MLTaskType,
  ModelLifecycleState,
  MLInferenceResult,
  MLAlgorithm,
} from '../types';
import { ModelTrainer } from './trainer';
import { TfIdfVectorizer } from './vectorizer';
import {
  MultinomialNaiveBayes,
  ComplementNaiveBayes,
  LogisticRegressionClassifier,
  LinearSVCClassifier,
  IClassifier,
} from './classifiers';
import fs from 'fs';
import path from 'path';

const REGISTRY_FILE = path.join(process.cwd(), '.data', 'models', 'registry.json');

export class ModelRegistry {
  private static ensureDirExists() {
    const dir = path.dirname(REGISTRY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public static loadRegistry(): ModelRegistryEntry[] {
    this.ensureDirExists();
    if (!fs.existsSync(REGISTRY_FILE)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8')) as ModelRegistryEntry[];
    } catch {
      return [];
    }
  }

  public static saveRegistry(entries: ModelRegistryEntry[]): void {
    this.ensureDirExists();
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(entries, null, 2), 'utf-8');
  }

  public static registerModel(
    modelId: string,
    state: ModelLifecycleState = 'approved',
    notes = 'Trained via multi-algorithm benchmarking pipeline'
  ): ModelRegistryEntry {
    const artifact = ModelTrainer.loadArtifact(modelId);
    if (!artifact) {
      throw new Error(`Model artifact not found for ID ${modelId}`);
    }

    const registry = this.loadRegistry();

    // If activating this model, demote any other active model for the same task
    if (state === 'active_production') {
      registry.forEach((entry) => {
        if (entry.task === artifact.task && entry.state === 'active_production') {
          entry.state = 'approved';
          entry.updatedAt = new Date().toISOString();
        }
      });
    }

    const existingIndex = registry.findIndex((e) => e.id === modelId);
    const entry: ModelRegistryEntry = {
      id: artifact.id,
      version: artifact.version,
      name: artifact.name,
      task: artifact.task,
      algorithm: artifact.algorithm,
      state,
      metrics: artifact.metrics,
      artifactPath: ModelTrainer.getArtifactPath(artifact.id),
      trainingSamplesCount: artifact.metrics.testSampleCount * 5, // Approximate corpus scale
      testSamplesCount: artifact.metrics.testSampleCount,
      createdAt: artifact.createdAt,
      updatedAt: new Date().toISOString(),
      deployedAt: state === 'active_production' ? new Date().toISOString() : undefined,
      notes,
    };

    if (existingIndex >= 0) {
      registry[existingIndex] = entry;
    } else {
      registry.unshift(entry);
    }

    this.saveRegistry(registry);
    return entry;
  }

  public static getActiveModel(task: MLTaskType): ModelRegistryEntry | null {
    const registry = this.loadRegistry();
    const active = registry.find((e) => e.task === task && e.state === 'active_production');
    if (active) return active;

    // Fall back to most recently approved model
    const approved = registry.find((e) => e.task === task && e.state === 'approved');
    return approved || null;
  }

  public static setModelState(modelId: string, state: ModelLifecycleState): ModelRegistryEntry {
    const registry = this.loadRegistry();
    const target = registry.find((e) => e.id === modelId);
    if (!target) {
      throw new Error(`Model ${modelId} not found in registry`);
    }

    if (state === 'active_production') {
      registry.forEach((e) => {
        if (e.task === target.task && e.state === 'active_production') {
          e.state = 'approved';
          e.updatedAt = new Date().toISOString();
        }
      });
      target.deployedAt = new Date().toISOString();
    }

    target.state = state;
    target.updatedAt = new Date().toISOString();
    this.saveRegistry(registry);
    return target;
  }

  public static getModelsByTask(task: MLTaskType): ModelRegistryEntry[] {
    return this.loadRegistry().filter((e) => e.task === task);
  }
}

/**
 * Live inference engine loading active serialized models and performing real-time predictions
 */
export class MLInferenceEngine {
  private static cachedModels: Map<
    string,
    {
      vectorizer: TfIdfVectorizer;
      classifier: IClassifier;
      algorithm: MLAlgorithm;
      version: string;
    }
  > = new Map();

  private static loadModelRuntime(modelId: string) {
    if (this.cachedModels.has(modelId)) {
      return this.cachedModels.get(modelId)!;
    }

    const artifact = ModelTrainer.loadArtifact(modelId);
    if (!artifact) return null;

    const vectorizer = new TfIdfVectorizer(artifact.hyperparameters as any);
    vectorizer.loadSerialized({
      vocabulary: artifact.vocabulary,
      idfWeights: artifact.idfWeights || {},
      config: artifact.hyperparameters as any,
    });

    let classifier: IClassifier;
    switch (artifact.algorithm) {
      case 'multinomial_naive_bayes':
        classifier = new MultinomialNaiveBayes();
        break;
      case 'complement_naive_bayes':
        classifier = new ComplementNaiveBayes();
        break;
      case 'logistic_regression':
        classifier = new LogisticRegressionClassifier();
        break;
      case 'linear_svc':
      default:
        classifier = new LinearSVCClassifier();
        break;
    }

    classifier.loadSerialized(artifact.weights as any);

    const runtime = {
      vectorizer,
      classifier,
      algorithm: artifact.algorithm,
      version: artifact.version,
    };

    this.cachedModels.set(modelId, runtime);
    return runtime;
  }

  public static predict(task: MLTaskType, text: string): MLInferenceResult | null {
    const activeEntry = ModelRegistry.getActiveModel(task);
    if (!activeEntry) return null;

    const runtime = this.loadModelRuntime(activeEntry.id);
    if (!runtime) return null;

    const start = Date.now();
    const vector = runtime.vectorizer.transform(text);
    const probas = runtime.classifier.predictProba(vector);

    let bestClass = Object.keys(probas)[0];
    let maxP = -1;

    Object.entries(probas).forEach(([cls, p]) => {
      if (p > maxP) {
        maxP = p;
        bestClass = cls;
      }
    });

    const latencyMs = Date.now() - start;
    const featureWeights = runtime.vectorizer.explainFeatures(text, 6);

    return {
      task,
      predictedLabel: bestClass,
      probabilities: probas,
      confidence: Number(maxP.toFixed(4)),
      modelVersion: runtime.version,
      algorithm: runtime.algorithm,
      latencyMs: Math.max(1, latencyMs),
      featureWeights,
    };
  }

  public static clearCache(): void {
    this.cachedModels.clear();
  }
}
