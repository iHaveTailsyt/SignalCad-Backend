import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
    _id: string; // the name of the counter
    seq: number;
}

const CounterSchema: Schema<ICounter> = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 16200 }
});

const Counter = mongoose.model<ICounter>('Counter', CounterSchema);
export default Counter;
