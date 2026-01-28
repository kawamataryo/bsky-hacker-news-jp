import * as Callable from "./functions/callable";
import * as PubSub from "./functions/pubsub";
import * as admin from "firebase-admin";

admin.initializeApp();
export const callable = { ...Callable };
export const pubsub = { ...PubSub };
