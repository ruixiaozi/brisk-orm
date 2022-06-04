import { UpdateOpData } from '@entity';
import {
  pickBy as _pickBy,
  isNil as _isNil,
} from 'lodash';
import { RuntimeTypeContainer } from 'brisk-ts-extends/types';

export class UpdateOpDataFactor {

  #data: any;

  #props: string[];

  constructor(className: string, data: any) {
    this.#data = data;
    const runtimeType = RuntimeTypeContainer.get(className);
    this.#props = runtimeType?.properties?.map((item) => item.name) || [];
  }


  public factory(): UpdateOpData {
    return _pickBy(
      this.#data,
      (item, key) => !_isNil(item) && this.#props.includes(key),
    ) || {} as UpdateOpData;
  }

}
