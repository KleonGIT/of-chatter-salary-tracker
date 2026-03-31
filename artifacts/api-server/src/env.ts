import { config } from "dotenv";
import path from "path";

config({ path: path.join(process.cwd(), "../../.env") });
config({ path: path.join(process.cwd(), ".env"), override: false });
