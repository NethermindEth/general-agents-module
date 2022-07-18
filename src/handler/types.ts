import { Finding } from "forta-agent";

export type FindingGenerator<T> = (data: T) => Finding;
