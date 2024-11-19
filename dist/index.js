"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFillAmount = getFillAmount;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const types_1 = require("./types");
const orederbook_1 = require("./orederbook");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT;
const MARKET = "TATA_INR";
let GLOBAL_TRADE_ID = 0;
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "*"
}));
app.post("/api/v1/order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const Order = types_1.OrderInputSchema.safeParse(req.body);
    if (!Order.success) {
        return res.status(400).json({
            message: "Please send out valid response",
            details: Order.error.message
        });
    }
    const orderid = getOrderId();
    const BASE_QUOTE = MARKET.split("_");
    if (Order.data.BaseAsset !== BASE_QUOTE[0] || Order.data.QuoteAsset !== BASE_QUOTE[1]) {
        return res.status(400).json({
            message: "The Base or Quote asset does not match."
        });
    }
    const { BaseAsset, QuoteAsset, price, kind, quantity, side } = Order.data;
    const { status, executedQty, fills } = fillOrder(orderid, quantity, price, side, kind);
    if (status == "Rejected") {
        return res.json({
            message: "Order cannot be executed as there is no liquidity.",
            executedQty
        });
    }
    console.log(orederbook_1.OrderBookwithQuantity);
    console.log(orederbook_1.Orderbook);
    return res.json({
        OrderId: orderid,
    });
}));
function getOrderId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
function fillOrder(orderid, quantity, price, side, kind) {
    const executedQty = 0;
    const fills = [];
    const MaximumFillAmount = getFillAmount(quantity, side, price);
    console.log(MaximumFillAmount);
    if (MaximumFillAmount < quantity && kind === "ioc") {
        return { status: 'Rejected', executedQty: MaximumFillAmount, fills: [] };
    }
    if (side === "buy") {
        orederbook_1.Orderbook.ask.forEach((o) => {
            if (o.price <= price) {
                quantity -= Math.min(o.quantity, quantity);
                if (quantity == 0) {
                    fills.push({
                        quantity: quantity,
                        side: "buy",
                        tradeId: GLOBAL_TRADE_ID++
                    });
                }
            }
        });
    }
    else {
        orederbook_1.Orderbook.bid.forEach((o) => {
            if (o.price >= price) {
                quantity -= Math.min(o.quantity, quantity);
            }
        });
    }
    if (quantity !== 0 && side == "buy") {
        if (orederbook_1.OrderBookwithQuantity.bids[price]) {
            orederbook_1.OrderBookwithQuantity.bids[price] += quantity;
        }
        else
            orederbook_1.OrderBookwithQuantity.bids[price] = quantity;
        orederbook_1.Orderbook.bid.push({
            price: price,
            quantity: quantity,
            orderId: orderid,
            side: "bid"
        });
    }
    else if (quantity !== 0 && side == "sell") {
        if (orederbook_1.OrderBookwithQuantity.ask[price]) {
            orederbook_1.OrderBookwithQuantity.ask[price] += quantity;
        }
        else
            orederbook_1.OrderBookwithQuantity.ask[price] = quantity;
        orederbook_1.Orderbook.ask.push({
            price: price,
            quantity: quantity,
            orderId: orderid,
            side: "ask"
        });
    }
    return { status: "Accepted", executedQty: MaximumFillAmount, fills: [] };
}
app.listen(port, () => {
    console.log("Server is running at ", port);
});
function getFillAmount(quantity, side, price) {
    let fill = 0;
    if (side == "buy") {
        //ts-ignore
        orederbook_1.Orderbook.ask.forEach((a) => {
            if (a.price <= price) {
                fill += Math.min(quantity, a.quantity);
            }
        });
    }
    else {
        orederbook_1.Orderbook.bid.forEach((b) => {
            if (b.price <= price) {
                fill += Math.min(quantity, b.quantity);
            }
        });
    }
    return fill;
}
