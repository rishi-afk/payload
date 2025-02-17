import { PayloadRequest } from '../express/types';
import { RelationshipField, fieldSupportsMany, fieldHasMaxDepth, UploadField } from './config/types';
import { Payload } from '..';

type PopulateArgs = {
  depth: number
  currentDepth: number
  req: PayloadRequest
  overrideAccess: boolean
  dataReference: Record<string, any>
  data: Record<string, unknown>
  field: RelationshipField | UploadField
  index?: number
  payload: Payload
  showHiddenFields: boolean
}

const populate = async ({
  depth,
  currentDepth,
  req,
  overrideAccess,
  dataReference,
  data,
  field,
  index,
  payload,
  showHiddenFields,
}: PopulateArgs) => {
  const dataToUpdate = dataReference;

  const relation = Array.isArray(field.relationTo) ? (data.relationTo as string) : field.relationTo;
  const relatedCollection = payload.collections[relation];

  if (relatedCollection) {
    let idString = Array.isArray(field.relationTo) ? data.value : data;

    if (typeof idString !== 'string' && typeof idString?.toString === 'function') {
      idString = idString.toString();
    }

    let populatedRelationship;

    if (depth && currentDepth <= depth) {
      populatedRelationship = await payload.findByID({
        req,
        collection: relatedCollection.config.slug,
        id: idString as string,
        currentDepth: currentDepth + 1,
        overrideAccess: typeof overrideAccess === 'undefined' ? false : overrideAccess,
        disableErrors: true,
        depth,
        showHiddenFields,
      });
    }

    // If populatedRelationship comes back, update value
    if (populatedRelationship || populatedRelationship === null) {
      if (typeof index === 'number') {
        if (Array.isArray(field.relationTo)) {
          dataToUpdate[field.name][index].value = populatedRelationship;
        } else {
          dataToUpdate[field.name][index] = populatedRelationship;
        }
      } else if (Array.isArray(field.relationTo)) {
        dataToUpdate[field.name].value = populatedRelationship;
      } else {
        dataToUpdate[field.name] = populatedRelationship;
      }
    }
  }
};

type PromiseArgs = {
  data: Record<string, any>
  field: RelationshipField | UploadField
  depth: number
  currentDepth: number
  req: PayloadRequest
  overrideAccess: boolean
  payload: Payload
  showHiddenFields: boolean
}

const relationshipPopulationPromise = ({
  data,
  field,
  depth,
  currentDepth,
  req,
  overrideAccess,
  payload,
  showHiddenFields,
}: PromiseArgs) => async (): Promise<void> => {
  const resultingData = data;
  const populateDepth = fieldHasMaxDepth(field) && field.maxDepth < depth ? field.maxDepth : depth;

  if (fieldSupportsMany(field) && field.hasMany && Array.isArray(data[field.name])) {
    const rowPromises = [];

    data[field.name].forEach((relatedDoc, index) => {
      const rowPromise = async () => {
        if (relatedDoc) {
          await populate({
            depth: populateDepth,
            currentDepth,
            req,
            overrideAccess,
            data: relatedDoc,
            dataReference: resultingData,
            field,
            index,
            payload,
            showHiddenFields,
          });
        }
      };

      rowPromises.push(rowPromise());
    });

    await Promise.all(rowPromises);
  } else if (data[field.name]) {
    await populate({
      depth: populateDepth,
      currentDepth,
      req,
      overrideAccess,
      dataReference: resultingData,
      data: data[field.name],
      field,
      payload,
      showHiddenFields,
    });
  }
};

export default relationshipPopulationPromise;
