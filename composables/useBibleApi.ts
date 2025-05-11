// composables/useBibleApi.ts
import { $fetch } from 'ofetch';

// Base URL for the Bible API
const API_BASE_URL = 'https://bible.helloao.org/api';

// --- TypeScript Interfaces for API Responses ---

export interface Translation {
  id: string;       // e.g., "BSB", "KJV"
  name: string;     // e.g., "Berean Standard Bible", "King James Version"
  language?: string; // e.g., "en"
  // The API might return more fields, this is a basic structure.
}

export interface Book {
  id: string;       // e.g., "GEN", "EXO" (often an abbreviation)
  name: string;     // e.g., "Genesis", "Exodus"
  testament?: string; // e.g., "OT", "NT"
  chapters?: number;  // Number of chapters in the book
  // The API response for books.json might vary.
  // Assuming it's an array of objects like: { "book_id": "GEN", "name": "Genesis", ... }
  // or { "id": "GEN", "name": "Genesis" }
}

export interface Verse {
  verse: string;    // Verse number, e.g., "1", "2-4"
  text: string;     // The text of the verse
  title?: string;   // Optional title for a section of verses
}

export interface ChapterContent {
  translation_id: string;
  book_id: string;
  book_name: string; // We'll add this manually after fetching
  chapter_number: string;
  verses: Verse[];
}

// --- Composable Function ---

export const useBibleApi = () => {
  /**
   * Fetches the list of available Bible translations.
   * @returns A promise that resolves to an array of Translation objects.
   */
  const getTranslations = async (): Promise<Translation[]> => {
    try {
      const translations = await $fetch<Translation[]>(`${API_BASE_URL}/available_translations.json`);
      // The API might return objects with keys like 'name' and 'id' or 'abbreviation'.
      // Ensure mapping if the structure is different, e.g. map 'abbreviation' to 'id'.
      // For this example, we assume a compatible structure like { id: 'BSB', name: 'Berean Standard Bible' }
      return translations;
    } catch (error) {
      console.error('Error fetching translations:', error);
      throw new Error('Failed to load translations.');
    }
  };

  /**
   * Fetches the list of books for a given translation.
   * @param translationId - The ID of the translation (e.g., "BSB").
   * @returns A promise that resolves to an array of Book objects.
   */
  const getBooks = async (translationId: string): Promise<Book[]> => {
    if (!translationId) {
      throw new Error('Translation ID is required to fetch books.');
    }
    try {
      // The API docs show the endpoint as /api/{translation}/books.json
      // The response structure needs to be mapped to the Book interface.
      // Example: API might return { "book_id": "GEN", "name": "Genesis", ... }
      // We need to ensure our Book interface { id: string, name: string } matches or is mapped.
      const rawBooks = await $fetch<any[]>(`${API_BASE_URL}/${translationId}/books.json`);
      return rawBooks.map(book => ({
        id: book.book_id || book.id, // Adapt based on actual API response key for book identifier
        name: book.name,
        testament: book.testament,
        chapters: book.chapters,
      }));
    } catch (error) {
      console.error(`Error fetching books for translation ${translationId}:`, error);
      throw new Error(`Failed to load books for ${translationId}.`);
    }
  };

  /**
   * Fetches the content of a specific chapter.
   * @param translationId - The ID of the translation.
   * @param bookId - The ID of the book (e.g., "GEN").
   * @param chapter - The chapter number.
   * @returns A promise that resolves to a ChapterContent object.
   */
  const getChapter = async (translationId: string, bookId: string, chapter: number): Promise<Omit<ChapterContent, 'book_name'>> => {
    if (!translationId || !bookId || !chapter) {
      throw new Error('Translation ID, Book ID, and Chapter number are required.');
    }
    try {
      // The API docs show the endpoint as /api/{translation}/{book}/{chapter}.json
      // The response structure needs to be mapped to ChapterContent.
      // Example: API might return { "translation_id": "BSB", "book_id": "GEN", "chapter": "1", "verses": [...] }
      const chapterData = await $fetch<any>(`${API_BASE_URL}/${translationId}/${bookId}/${chapter}.json`);
      return {
        translation_id: chapterData.translation_id || translationId,
        book_id: chapterData.book_id || bookId,
        chapter_number: String(chapterData.chapter || chapterData.chapter_number || chapter),
        verses: chapterData.verses || [],
      };
    } catch (error) {
      console.error(`Error fetching chapter ${translationId}/${bookId}/${chapter}:`, error);
      throw new Error(`Failed to load chapter ${bookId} ${chapter}.`);
    }
  };

  return {
    getTranslations,
    getBooks,
    getChapter,
  };
};
