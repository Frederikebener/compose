import utils from "../utils.js";
import fs from "fs";

// Appwrite removed their static install endpoints (appwrite.io/install/compose).
// The compose file is now generated client-side from this TypeScript template source.
const COMPOSE_DATA_URL =
  "https://raw.githubusercontent.com/appwrite/website/main/src/lib/components/compose-generator/composeData.ts";

console.log("Fetching Appwrite compose generator data...");
await utils.downloadFile(COMPOSE_DATA_URL, "/tmp/appwrite-composeData.ts");

const content = fs.readFileSync("/tmp/appwrite-composeData.ts", "utf8");

function extractTemplateLiteral(src, name) {
  const regex = new RegExp(`const ${name} = \`((?:[^\`\\\\]|\\\\.)*)\``, "s");
  const match = src.match(regex);
  if (!match) throw new Error(`Could not extract ${name} from composeData.ts`);
  return match[1].replace(/\\`/g, "`").replace(/\\\$/g, "$");
}

const COMPOSE_TEMPLATE = extractTemplateLiteral(content, "COMPOSE_TEMPLATE");
const ENV_TEMPLATE = extractTemplateLiteral(content, "ENV_TEMPLATE");
const MARIADB_SERVICE = extractTemplateLiteral(content, "MARIADB_SERVICE");
const MARIADB_VOLUMES = extractTemplateLiteral(content, "MARIADB_VOLUMES");

const compose = COMPOSE_TEMPLATE.replaceAll("__DB_SERVICE__", "mariadb")
  .replace("__DB_BLOCK__", MARIADB_SERVICE)
  .replace("__ASSISTANT_BLOCK__", "")
  .replace("__DB_VOLUMES__", MARIADB_VOLUMES);

const env = ENV_TEMPLATE.replace("__DB_ADAPTER__", "mariadb")
  .replace("__DB_HOST__", "mariadb")
  .replace("__DB_PORT__", "3306")
  .replace("__ASSISTANT_KEY__", "");

fs.writeFileSync("./code/docker-compose.yml", compose);
fs.writeFileSync("./code/.env.example", env);

console.log("Generated docker-compose.yml and .env.example");

await utils.removeContainerNames("./code/docker-compose.yml");
await utils.removePorts("./code/docker-compose.yml");

await utils.searchReplace(
  "./code/.env.example",
  "_APP_DOMAIN=appwrite.test",
  "_APP_DOMAIN=$(PRIMARY_DOMAIN)"
);
