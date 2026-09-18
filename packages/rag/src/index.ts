import { ChromaClient, type Collection } from "chromadb";

export interface EmbeddedChunk {
  id: string;
  text: string;
  embedding: number[];
}

export interface RetrievalResult {
  chunk: EmbeddedChunk;
  score: number;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

// ---- Vector store abstraction ----
// Every caller depends on this interface only, never on a specific
// provider's client. ChromaVectorStore below is the local-dev backend; a
// managed store (e.g. Pinecone) for production implements the same
// interface, so swapping backends never touches calling code.

export interface VectorStoreDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, string | number | boolean>;
}

export interface VectorQueryResult {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface VectorStore {
  upsert(documents: VectorStoreDocument[]): Promise<void>;
  query(embedding: number[], topK: number): Promise<VectorQueryResult[]>;
  delete(ids: string[]): Promise<void>;
}

export interface ChromaVectorStoreConfig {
  url: string;
  collectionName: string;
}

export class ChromaVectorStore implements VectorStore {
  private readonly client: ChromaClient;
  private readonly collectionName: string;
  private collection: Collection | null = null;

  constructor(config: ChromaVectorStoreConfig) {
    const parsed = new URL(config.url);
    this.client = new ChromaClient({
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 8000,
      ssl: parsed.protocol === "https:",
    });
    this.collectionName = config.collectionName;
  }

  private async getCollection(): Promise<Collection> {
    if (!this.collection) {
      // embeddingFunction: null — embeddings are always supplied by the
      // caller (e.g. via Gemini's embedding API), never computed by Chroma.
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        embeddingFunction: null,
      });
    }
    return this.collection;
  }

  async upsert(documents: VectorStoreDocument[]): Promise<void> {
    if (documents.length === 0) return;
    const collection = await this.getCollection();
    await collection.upsert({
      ids: documents.map((d) => d.id),
      embeddings: documents.map((d) => d.embedding),
      documents: documents.map((d) => d.text),
      metadatas: documents.map((d) => d.metadata ?? {}),
    });
  }

  async query(embedding: number[], topK: number): Promise<VectorQueryResult[]> {
    const collection = await this.getCollection();
    const result = await collection.query({
      queryEmbeddings: [embedding],
      nResults: topK,
    });

    const ids = result.ids[0] ?? [];
    const documents = result.documents[0] ?? [];
    const distances = result.distances[0] ?? [];
    const metadatas = result.metadatas[0] ?? [];

    return ids.map((id, i) => ({
      id,
      text: documents[i] ?? "",
      // Chroma returns a distance (lower = more similar); convert to a
      // provider-agnostic similarity score so callers never need to know
      // which distance metric the collection was created with.
      score: 1 / (1 + (distances[i] ?? 0)),
      metadata: (metadatas[i] ?? undefined) as Record<string, string | number | boolean> | undefined,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const collection = await this.getCollection();
    await collection.delete({ ids });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.heartbeat();
      return true;
    } catch {
      return false;
    }
  }
}
