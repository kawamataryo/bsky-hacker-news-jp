import * as Callable from "./functions/callable";
import * as PubSub from "./functions/pubsub";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
// グローバルな fetch 関数を node-fetch の実装でオーバーライドします
(global as any).fetch = fetch;

admin.initializeApp();
export const callable = { ...Callable };
export const pubsub = { ...PubSub };
