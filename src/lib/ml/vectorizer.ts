export interface VectorizerConfig {
  ngramRange: [number, number]; // e.g. [1, 2] for unigrams and bigrams
  minDf: number; // minimum document frequency
  maxFeatures?: number; // max top terms by frequency
  sublinearTf: boolean; // sublinear term frequency: 1 + log(tf)
}

export const DEFAULT_VECTORIZER_CONFIG: VectorizerConfig = {
  ngramRange: [1, 2],
  minDf: 1,
  maxFeatures: 1500,
  sublinearTf: true,
};

// Standard financial and general English stop words to filter out noise
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as',
  'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'by', 'during',
  'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here',
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its',
  'itself', 'me', 'more', 'most', 'my', 'myself', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'you', 'your', 'yours', 'yourself',
]);

export class TfIdfVectorizer {
  private config: VectorizerConfig;
  public vocabulary: Record<string, number> = {}; // term -> index
  public idfWeights: Record<string, number> = {}; // term -> idf value
  public isFitted = false;

  constructor(config: Partial<VectorizerConfig> = {}) {
    this.config = { ...DEFAULT_VECTORIZER_CONFIG, ...config };
  }

  /**
   * Tokenize text into lowercased alphanumeric tokens, stripping punctuation
   */
  public tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9_\s-]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  }

  /**
   * Extract unigrams and n-grams up to max range
   */
  public extractNgrams(tokens: string[]): string[] {
    const [minN, maxN] = this.config.ngramRange;
    const ngrams: string[] = [];

    for (let n = minN; n <= maxN; n++) {
      for (let i = 0; i <= tokens.length - n; i++) {
        const slice = tokens.slice(i, i + n);
        ngrams.push(slice.join('_'));
      }
    }

    return ngrams;
  }

  /**
   * Strictly fit the vectorizer ONLY on training documents to prevent data leakage.
   */
  public fit(documents: string[]): this {
    const docTermFreqs: Array<Map<string, number>> = [];
    const termDocCounts: Map<string, number> = new Map();
    const termTotalCounts: Map<string, number> = new Map();

    documents.forEach((doc) => {
      const tokens = this.tokenize(doc);
      const ngrams = this.extractNgrams(tokens);
      const tfMap = new Map<string, number>();

      ngrams.forEach((term) => {
        tfMap.set(term, (tfMap.get(term) || 0) + 1);
        termTotalCounts.set(term, (termTotalCounts.get(term) || 0) + 1);
      });

      // Count unique document occurrences for IDF
      tfMap.forEach((_, term) => {
        termDocCounts.set(term, (termDocCounts.get(term) || 0) + 1);
      });

      docTermFreqs.push(tfMap);
    });

    // Filter by minDf
    let eligibleTerms = Array.from(termDocCounts.entries())
      .filter(([_, docCount]) => docCount >= this.config.minDf)
      .map(([term]) => term);

    // If maxFeatures is specified, keep top features by overall corpus frequency
    if (this.config.maxFeatures && eligibleTerms.length > this.config.maxFeatures) {
      eligibleTerms.sort(
        (a, b) => (termTotalCounts.get(b) || 0) - (termTotalCounts.get(a) || 0)
      );
      eligibleTerms = eligibleTerms.slice(0, this.config.maxFeatures);
    }

    // Build vocabulary index mapping
    this.vocabulary = {};
    eligibleTerms.forEach((term, index) => {
      this.vocabulary[term] = index;
    });

    // Compute smooth IDF: log((1 + N) / (1 + df)) + 1
    const N = documents.length;
    this.idfWeights = {};
    eligibleTerms.forEach((term) => {
      const df = termDocCounts.get(term) || 1;
      const idf = Math.log((1 + N) / (1 + df)) + 1.0;
      this.idfWeights[term] = idf;
    });

    this.isFitted = true;
    return this;
  }

  /**
   * Transform a document into a normalized sparse vector (array of weights)
   */
  public transform(document: string): number[] {
    if (!this.isFitted) {
      throw new Error('TfIdfVectorizer must be fitted before calling transform()');
    }

    const vocabSize = Object.keys(this.vocabulary).length;
    const vector = new Array<number>(vocabSize).fill(0);

    const tokens = this.tokenize(document);
    const ngrams = this.extractNgrams(tokens);

    // Count term frequencies
    const tfMap = new Map<string, number>();
    ngrams.forEach((term) => {
      tfMap.set(term, (tfMap.get(term) || 0) + 1);
    });

    // Calculate TF-IDF
    let normSq = 0;
    tfMap.forEach((rawTf, term) => {
      const idx = this.vocabulary[term];
      if (idx !== undefined) {
        const idf = this.idfWeights[term] || 1.0;
        const tf = this.config.sublinearTf ? 1 + Math.log(rawTf) : rawTf;
        const weight = tf * idf;
        vector[idx] = weight;
        normSq += weight * weight;
      }
    });

    // Euclidean (L2) normalization: ||v||_2 = 1
    if (normSq > 0) {
      const norm = Math.sqrt(normSq);
      for (let i = 0; i < vocabSize; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  public fitTransform(documents: string[]): number[][] {
    this.fit(documents);
    return documents.map((doc) => this.transform(doc));
  }

  /**
   * Extract top weighted terms from a document for interpretability
   */
  public explainFeatures(document: string, topN = 5): Array<{ term: string; weight: number }> {
    const vector = this.transform(document);
    const indexed = Object.entries(this.vocabulary).map(([term, idx]) => ({
      term,
      weight: vector[idx],
    }));

    return indexed
      .filter((x) => x.weight > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, topN);
  }

  public serialize() {
    return {
      vocabulary: this.vocabulary,
      idfWeights: this.idfWeights,
      config: this.config,
    };
  }

  public loadSerialized(data: {
    vocabulary: Record<string, number>;
    idfWeights: Record<string, number>;
    config?: Partial<VectorizerConfig>;
  }) {
    this.vocabulary = data.vocabulary;
    this.idfWeights = data.idfWeights;
    if (data.config) this.config = { ...this.config, ...data.config };
    this.isFitted = true;
  }
}
