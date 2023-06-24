import Ajv from 'ajv';
const schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "lists": {
        "type": "object",
        "maxProperties": 10,
        "additionalProperties": {
          "type": "array",
          "items": {
            "type": "number"
          }
        }
      },
      "chosen": {
        "type": "string"
      }
    },
    "required": [
      "lists",
      "chosen"
    ]
  };

const ajv = new Ajv();
export const validate = ajv.compile(schema);
export interface ChampionsJSON {
    chosen: string;
    lists:  { [key: string]: number[] };
  }
  