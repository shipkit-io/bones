import { Checkout } from "@polar-sh/nextjs";
import { polarConfig } from "../config";

export const GET = Checkout(polarConfig);
