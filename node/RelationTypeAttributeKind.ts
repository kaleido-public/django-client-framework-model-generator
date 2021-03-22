import { TypeAttributeKind } from "quicktype/dist/quicktype-core"

export type RelationType =
    | "OneToOneRel"
    | "ManyToOneRel"
    | "ManyToManyRel"
    | "UniqueForeignKey"
    | "ForeignKey"

export interface RelationManager {
    type: RelationType
    to: string
}

export type RelationManagerSet = { [key: string]: RelationManager }

export class RelationTypeAttributeKind extends TypeAttributeKind<RelationManagerSet> {
    constructor() {
        // This name is only used for debugging purposes.
        super("relation manager")
    }

    // When two or more classes are combined, such as in a "oneOf" schema, the
    // resulting class is a game object if at least one of the constituent
    // classes is a game object.
    combine(attrs: RelationManagerSet[]): RelationManagerSet {
        return attrs.reduce((prev, curr, idx, arr) => {
            return { ...curr, ...prev }
        })
    }

    // Type attributes are made inferred in cases where the given type
    // participates in a union with other non-class types, for example.  In
    // those cases, the union type does not get the attribute at all.
    makeInferred(_: RelationManagerSet): undefined {
        return undefined
    }

    // For debugging purposes only.  It shows up when quicktype is run with
    // with the "debugPrintGraph" option.
    stringify(isRelation: RelationManagerSet): string {
        return isRelation.toString()
    }
}

export const relationTypeAttributeKind = new RelationTypeAttributeKind()
