export interface Ordertype {
    price: number,
    quantity: number,
    orderId: string
}

export interface Bid extends Ordertype {
    side: "bid"
}

export interface Ask extends Ordertype {
    side: "ask"
}


interface Orderbooktype { bid: Bid[], ask: Ask[] }

interface Orderbookwithquantitytype { bids: { [price: number]: number }, ask: { [price: number]: number } }
export const Orderbook: Orderbooktype = {
    bid: [],
    ask: []
}

export const OrderBookwithQuantity: Orderbookwithquantitytype = {
    bids: {},
    ask: {}
}