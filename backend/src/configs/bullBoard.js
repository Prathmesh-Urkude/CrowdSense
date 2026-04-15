import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { emailQueue } from "./emailQueue.js";

const serverAdapter = new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

const { addQueue, removeQueue, setQueues } = createBullBoard({
    queues: [new BullAdapter(emailQueue)],
    serverAdapter,
});

export { serverAdapter};