import { App } from "./app.types";

export interface CuratedSection {
  id: string;
  title: string;
  description?: string;
  apps: App[];
}

export interface CuratedContent {
  sections: CuratedSection[];
}
