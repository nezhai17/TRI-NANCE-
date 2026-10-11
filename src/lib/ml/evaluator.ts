import {
  EvaluationMetrics,
  ClassMetric,
  ConfusionMatrix,
  ConfusionMatrixCell,
} from '../types';

export class ModelEvaluator {
  /**
   * Evaluate multi-class classification predictions against true labels.
   * Computes Macro F1, Weighted F1, Per-class Precision/Recall/F1, Confusion Matrix, and Calibration.
   */
  public static evaluate(
    trueLabels: string[],
    predictedLabels: string[],
    predictedProbas?: Array<Record<string, number>>
  ): EvaluationMetrics {
    const numSamples = trueLabels.length;
    if (numSamples === 0) {
      throw new Error('Cannot evaluate empty predictions array');
    }

    // Extract unique sorted classes
    const uniqueClasses = Array.from(
      new Set([...trueLabels, ...predictedLabels])
    ).sort();

    // Initialize confusion matrix
    const labelToIndex: Record<string, number> = {};
    uniqueClasses.forEach((cls, i) => {
      labelToIndex[cls] = i;
    });

    const matrix: number[][] = Array.from({ length: uniqueClasses.length }, () =>
      new Array(uniqueClasses.length).fill(0)
    );

    for (let i = 0; i < numSamples; i++) {
      const actualIdx = labelToIndex[trueLabels[i]];
      const predIdx = labelToIndex[predictedLabels[i]];
      if (actualIdx !== undefined && predIdx !== undefined) {
        matrix[actualIdx][predIdx] += 1;
      }
    }

    const details: ConfusionMatrixCell[] = [];
    for (let r = 0; r < uniqueClasses.length; r++) {
      for (let c = 0; c < uniqueClasses.length; c++) {
        details.push({
          actual: uniqueClasses[r],
          predicted: uniqueClasses[c],
          count: matrix[r][c],
        });
      }
    }

    const confusionMatrix: ConfusionMatrix = {
      labels: uniqueClasses,
      matrix,
      details,
    };

    // Calculate per-class metrics
    const perClass: Record<string, ClassMetric> = {};
    let totalCorrect = 0;
    let macroPrecisionSum = 0;
    let macroRecallSum = 0;
    let macroF1Sum = 0;

    let weightedF1Sum = 0;

    uniqueClasses.forEach((cls, i) => {
      const tp = matrix[i][i];
      totalCorrect += tp;

      // Actual row sum (support)
      let support = 0;
      for (let c = 0; c < uniqueClasses.length; c++) {
        support += matrix[i][c];
      }

      // Predicted column sum
      let totalPredicted = 0;
      for (let r = 0; r < uniqueClasses.length; r++) {
        totalPredicted += matrix[r][i];
      }

      const precision = totalPredicted > 0 ? tp / totalPredicted : 0;
      const recall = support > 0 ? tp / support : 0;
      const f1 =
        precision + recall > 0
          ? (2 * precision * recall) / (precision + recall)
          : 0;

      perClass[cls] = {
        className: cls,
        precision: Number(precision.toFixed(4)),
        recall: Number(recall.toFixed(4)),
        f1Score: Number(f1.toFixed(4)),
        support,
      };

      macroPrecisionSum += precision;
      macroRecallSum += recall;
      macroF1Sum += f1;
      weightedF1Sum += f1 * support;
    });

    const numClasses = uniqueClasses.length;
    const accuracy = Number((totalCorrect / numSamples).toFixed(4));
    const macroF1 = Number((macroF1Sum / (numClasses > 0 ? numClasses : 1)).toFixed(4));
    const weightedF1 = Number((weightedF1Sum / (numSamples > 0 ? numSamples : 1)).toFixed(4));

    // Calculate Brier score if predicted probabilities are provided
    let brierScore: number | undefined = undefined;
    if (predictedProbas && predictedProbas.length === numSamples) {
      let brierSum = 0;
      for (let i = 0; i < numSamples; i++) {
        const actual = trueLabels[i];
        const probas = predictedProbas[i];
        uniqueClasses.forEach((cls) => {
          const target = cls === actual ? 1.0 : 0.0;
          const p = probas[cls] || 0;
          brierSum += Math.pow(p - target, 2);
        });
      }
      brierScore = Number((brierSum / (numSamples * numClasses)).toFixed(4));
    }

    return {
      macroF1,
      weightedF1,
      accuracy,
      brierScore,
      perClass,
      confusionMatrix,
      testSampleCount: numSamples,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
