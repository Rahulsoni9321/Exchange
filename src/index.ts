import express from "express"
import dotenv from 'dotenv';
import cors from "cors";
import { z } from "zod";
import { OrderInputSchema } from "./types";
import { Ask, Bid, Orderbook, OrderBookwithQuantity } from "./orederbook";
dotenv.config();
const app = express();
const port = process.env.PORT;
const MARKET = "TATA_INR";
let GLOBAL_TRADE_ID = 0;

app.use(express.json());
app.use(cors({
    origin: "*"
}))

app.post("/api/v1/order", async (req, res: any) => {
    const Order = OrderInputSchema.safeParse(req.body);
    if (!Order.success) {
        return res.status(400).json({
            message: "Please send out valid response",
            details: Order.error.message
        })
    }
    const orderid = getOrderId();
    const BASE_QUOTE = MARKET.split("_");
    if (Order.data.BaseAsset !== BASE_QUOTE[0] || Order.data.QuoteAsset !== BASE_QUOTE[1]) {
        return res.status(400).json({
            message: "The Base or Quote asset does not match."
        })

    }
    const { BaseAsset, QuoteAsset, price, kind, quantity, side } = Order.data;

    const { status, executedQty, fills } = fillOrder(orderid, quantity, price, side, kind);
    if (status == "Rejected") {
        return res.json({
            message: "Order cannot be executed as there is no liquidity.",
            executedQty, fills
        })
    }
    console.log(OrderBookwithQuantity);
    console.log(Orderbook);

    return res.json({
        status, executedQty, fills

    })
})


function getOrderId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

interface Fill {
    quantity: number,
    side: "buy" | "sell",
    tradeId: number
}

function fillOrder(orderid: string, quantity: number, price: number, side: "buy" | "sell", kind?: "ioc"): { status: "Rejected" | "Accepted", executedQty: number, fills: Fill[] } {
    let executedQty = 0;
    const fills: Fill[] = [];

    const MaximumFillAmount = getFillAmount(quantity, side, price);


    if (MaximumFillAmount < quantity && kind === "ioc") {
        return { status: 'Rejected', executedQty: MaximumFillAmount, fills: [] }
    }



    if (side === "buy") {

        Orderbook.ask.forEach((o) => {
            if (o.price <= price && quantity > 0) {
                const filledQuantity = Math.min(o.quantity, quantity);
                executedQty += filledQuantity;
                quantity -= filledQuantity;
                o.quantity -= filledQuantity;
                OrderBookwithQuantity.ask[o.price] -= filledQuantity;
                fills.push({
                    quantity: filledQuantity,
                    side: "buy",
                    tradeId: GLOBAL_TRADE_ID++
                })

                if (o.quantity === 0) {
                    Orderbook.ask.splice(Orderbook.ask.indexOf(o), 1)
                }

                if (OrderBookwithQuantity.ask[o.price] === 0) {
                    delete OrderBookwithQuantity.ask[o.price];
                }
            }


        })
    }
    else {
        Orderbook.bid.forEach((o) => {
            if (o.price >= price && quantity > 0) {
                const filledQuantity = Math.min(o.quantity, quantity);
                executedQty += filledQuantity;
                quantity -= filledQuantity;
                o.quantity -= filledQuantity;
                OrderBookwithQuantity.bids[o.price] -= filledQuantity;
                fills.push({
                    quantity: filledQuantity,
                    side: "sell",
                    tradeId: GLOBAL_TRADE_ID++
                })

                if (o.quantity === 0) {
                    Orderbook.bid.splice(Orderbook.bid.indexOf(o), 1)
                }

                if (OrderBookwithQuantity.bids[o.price] === 0) {
                    delete OrderBookwithQuantity.bids[o.price];
                }
            }

        })
    }


    if (quantity !== 0) {

        if (side == "buy") {

            if (OrderBookwithQuantity.bids[price]) {
                OrderBookwithQuantity.bids[price] += quantity;
            }
            else
                OrderBookwithQuantity.bids[price] = quantity;

            Orderbook.bid.push({
                price: price,
                quantity: quantity,
                orderId: orderid,
                side: "bid"
            })
        }


        else {

            if (OrderBookwithQuantity.ask[price]) {
                OrderBookwithQuantity.ask[price] += quantity;
            }
            else
                OrderBookwithQuantity.ask[price] = quantity;

            Orderbook.ask.push({
                price: price,
                quantity: quantity,
                orderId: orderid,
                side: "ask"
            })

        }
    }

    return { status: "Accepted", executedQty: MaximumFillAmount, fills: [] }
}

app.listen(port, () => {
    console.log("Server is running at ", port)
})


export function getFillAmount(quantity: number, side: "buy" | "sell", price: number) {
    let fill = 0;
    if (side == "buy") {
        //ts-ignore
        Orderbook.ask.forEach((a: Ask) => {
            if (a.price <= price) {
                fill += Math.min(quantity, a.quantity)
            }

        })
    }
    else {
        Orderbook.bid.forEach((b: Bid) => {
            if (b.price <= price) {
                fill += Math.min(quantity, b.quantity)
            }

        })
    }

    return fill;
}


