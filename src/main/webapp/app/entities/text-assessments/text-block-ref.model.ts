import { TextBlock } from 'app/entities/text-block/text-block.model';
import { Feedback } from 'app/entities/feedback';

export class TextBlockRef {
    constructor(public block: TextBlock, public feedback?: Feedback) {}
}
