import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  Category,
  Comment,
  Promotion,
  SpendingRecord,
  Store,
} from "@/modules/shared/types";

export interface StoreSubmission {
  id: string;
  name: string;
  category: Category | string;
  address: string | null;
  phone: string | null;
  description: string | null;
  lat: number | null;
  lng: number | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

interface LocalDatabase {
  stores: Store[];
  store_submissions: StoreSubmission[];
  promotions: Promotion[];
  comments: Comment[];
  spending_records: SpendingRecord[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "local-db.json");
const SUBMISSION_QUEUE_FILE = path.join(DB_DIR, "store-submission-queue.json");
const CRAWLER_DATA_PREFIX = "dataset_crawler-google-places_";

interface CrawlerPlace {
  title?: string;
  price?: string | null;
  categoryName?: string | null;
  address?: string | null;
  phone?: string | null;
  totalScore?: number | null;
  placeId?: string | null;
  imageUrl?: string | null;
  openingHours?: Array<{ day?: string; hours?: string }>;
  location?: { lat?: number; lng?: number };
  categories?: string[];
  permanentlyClosed?: boolean;
  temporarilyClosed?: boolean;
}

const INITIAL_DB: LocalDatabase = {
  stores: [],
  store_submissions: [],
  promotions: [],
  comments: [],
  spending_records: [],
};

function parsePriceRange(price?: string | null): number | undefined {
  if (!price) return undefined;
  const dollarCount = (price.match(/\$/g) ?? []).length;
  if (dollarCount >= 3) return 3;
  if (dollarCount === 2) return 2;
  if (dollarCount === 1) {
    const nums = price.match(/\d+/g)?.map(Number) ?? [];
    const high = nums.length > 0 ? Math.max(...nums) : undefined;
    if (!high) return 1;
    if (high <= 80) return 1;
    if (high <= 150) return 2;
    return 3;
  }
  return undefined;
}

function mapCategory(place: CrawlerPlace): Category {
  const text = `${place.categoryName ?? ""} ${(place.categories ?? []).join(" ")} ${place.title ?? ""}`;
  if (/早餐|早午餐|brunch/i.test(text)) return "早餐";
  if (/珍珠奶茶|飲料|咖啡|茶店|tea|coffee/i.test(text)) return "飲料";
  if (/日式|日本|壽司|拉麵|居酒屋|丼|燒肉|烏龍麵/i.test(text)) return "日式";
  if (/速食|漢堡|炸雞|fast\s*food/i.test(text)) return "速食";
  if (/便當/i.test(text)) return "便當";
  if (/小吃|夜市|鹽酥雞|蔥油餅|滷味/i.test(text)) return "小吃";
  if (/中式|台灣|中菜|麵館|熱炒|火鍋|餐廳|牛肉麵/i.test(text)) return "中式";
  return "其他";
}

function isLikelyFoodPlace(place: CrawlerPlace): boolean {
  const text = `${place.categoryName ?? ""} ${(place.categories ?? []).join(" ")} ${place.title ?? ""}`;
  if (/停放架|bike|parking|公園|景點|住宿|飯店|hotel|加油站/i.test(text)) return false;
  return /餐|吃|飲|咖啡|茶|小吃|早餐|便當|火鍋|拉麵|壽司|牛排|居酒屋|麵|甜點|夜市|food/i.test(text);
}

function openingHoursToText(openingHours?: Array<{ day?: string; hours?: string }>): string | undefined {
  if (!openingHours || openingHours.length === 0) return undefined;
  return openingHours
    .filter((item) => item.day && item.hours)
    .map((item) => `${item.day} ${item.hours}`)
    .join("; ");
}

async function loadCrawlerStores(): Promise<Store[]> {
  const files = await readdir(DB_DIR);
  const crawlerFiles = files
    .filter((name) => name.startsWith(CRAWLER_DATA_PREFIX) && name.endsWith(".json"))
    .sort()
    .reverse();

  if (crawlerFiles.length === 0) return [];

  const latestCrawlerFile = path.join(DB_DIR, crawlerFiles[0]);
  const raw = await readFile(latestCrawlerFile, "utf8");
  const places = JSON.parse(raw) as CrawlerPlace[];
  const seenIds = new Set<string>();

  return places
    .filter((place) => !!place.placeId)
    .filter((place) => !place.permanentlyClosed && !place.temporarilyClosed)
    .filter((place) => !!place.location?.lat && !!place.location?.lng)
    .filter(isLikelyFoodPlace)
    .filter((place) => {
      const id = place.placeId as string;
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    })
    .map((place) => {
      const id = place.placeId as string;
      const name = (place.title ?? "未命名店家").trim();
      const category = mapCategory(place);
      const lat = place.location?.lat as number;
      const lng = place.location?.lng as number;

      return {
        id,
        name,
        category,
        lat,
        lng,
        address: place.address ?? undefined,
        phone: place.phone ?? undefined,
        rating: place.totalScore ?? undefined,
        price_range: parsePriceRange(place.price),
        image_url: place.imageUrl ?? undefined,
        description: `${place.categoryName ?? category} · Google Maps 資料`,
        hours: openingHoursToText(place.openingHours),
      } satisfies Store;
    });
}

function isLegacyMockStoreData(stores: Store[]): boolean {
  return (
    stores.length > 0 &&
    stores.length <= 20 &&
    stores.every((store) => /^\d+$/.test(store.id))
  );
}

async function ensureDbFile() {
  await mkdir(DB_DIR, { recursive: true });

  const crawlerStores = await loadCrawlerStores();

  try {
    const raw = await readFile(DB_FILE, "utf8");
    const existingDb = JSON.parse(raw) as LocalDatabase;

    if (crawlerStores.length > 0 && isLegacyMockStoreData(existingDb.stores)) {
      const migratedDb: LocalDatabase = {
        ...existingDb,
        stores: crawlerStores,
        promotions: Array.isArray(existingDb.promotions) ? existingDb.promotions : [],
      };
      await writeFile(DB_FILE, JSON.stringify(migratedDb, null, 2), "utf8");
    }
  } catch {
    const initialDb: LocalDatabase = {
      ...INITIAL_DB,
      stores: crawlerStores,
    };
    await writeFile(DB_FILE, JSON.stringify(initialDb, null, 2), "utf8");
  }

  try {
    await readFile(SUBMISSION_QUEUE_FILE, "utf8");
  } catch {
    await writeFile(SUBMISSION_QUEUE_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

export async function readLocalDb(): Promise<LocalDatabase> {
  await ensureDbFile();
  const raw = await readFile(DB_FILE, "utf8");
  return JSON.parse(raw) as LocalDatabase;
}

export async function writeLocalDb(data: LocalDatabase) {
  await ensureDbFile();
  await writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function readStoreSubmissionQueue(): Promise<StoreSubmission[]> {
  await ensureDbFile();
  const raw = await readFile(SUBMISSION_QUEUE_FILE, "utf8");
  return JSON.parse(raw) as StoreSubmission[];
}

export async function writeStoreSubmissionQueue(data: StoreSubmission[]) {
  await ensureDbFile();
  await writeFile(SUBMISSION_QUEUE_FILE, JSON.stringify(data, null, 2), "utf8");
}
