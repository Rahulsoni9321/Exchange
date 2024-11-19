import { z } from "zod";


export const OrderInputSchema  = z.object({
    quantity: z.number().positive({ message: "Please Enter Valid quantity." }),
    side: z.enum(["buy", "sell"]),
    type: z.enum(["limit", "market"]),
    kind: z.enum(["ioc"]).optional(),
    BaseAsset: z.string(),
    QuoteAsset: z.string(),
    price: z.number().positive({ message: "Please enter valid price." }),


})