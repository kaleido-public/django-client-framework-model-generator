"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.relationAttributeProducer =
    exports.relationTypeAttributeKind =
    exports.RelationTypeAttributeKind =
        void 0
const quicktype_core_1 = require("quicktype/dist/quicktype-core")
class RelationTypeAttributeKind extends quicktype_core_1.TypeAttributeKind {
    constructor() {
        // This name is only used for debugging purposes.
        super("relation manager")
    }
    // When two or more classes are combined, such as in a "oneOf" schema, the
    // resulting class is a game object if at least one of the constituent
    // classes is a game object.
    combine(attrs) {
        return attrs.reduce((prev, curr, idx, arr) => {
            return { ...curr, ...prev }
        })
    }
    // Type attributes are made inferred in cases where the given type
    // participates in a union with other non-class types, for example.  In
    // those cases, the union type does not get the attribute at all.
    makeInferred(_) {
        return undefined
    }
    // For debugging purposes only.  It shows up when quicktype is run with
    // with the "debugPrintGraph" option.
    stringify(isRelation) {
        return isRelation.toString()
    }
}
exports.RelationTypeAttributeKind = RelationTypeAttributeKind
exports.relationTypeAttributeKind = new RelationTypeAttributeKind()
// "schema" is the JSON object in the schema for the type it's being applied to.
// In the case of our "Player" type, that would be the object at "definitions.Player"
// in the schema.
// "canonicalRef" is the location in the schema of that type.  We only use it in an
// error message here.
// "types" is a set of JSON type specifiers, such as "object", "string", or
// "Object".  The reason it's a set and not just a single one is that one type
// within the schema can specify values of more than one JSON type.  For example,
// { "type": ["string", "Object"] } is a JSON Schema for "all strings and all
// Objects".
function relationAttributeProducer(schema, canonicalRef, types) {
    // Objects are valid JSON Schemas, too: "true" means "all values allowed" and
    // "false" means "no values allowed".  In fact, the "false" for
    // additionalProperties in our schema is a case of the latter.  For that reason,
    // our producer could be called on a Object, which we have to check for first.
    if (typeof schema !== "object") return undefined
    // Next we check whether the type we're supposed to produce attributes for even
    // allows objects as values.  If it doesn't, it's not our business, so we
    // return "undefined".
    if (!types.has("object")) return undefined
    // Now we can finally check whether our type is supposed to be a game object.
    let relations
    if (schema.relationalProperties === undefined) {
        // If it doesn't have the "relationalProperties" property, it isn't.
        relations = {}
    } else if (typeof schema.relationalProperties === "object") {
        // If it does have it, we make sure it's a Object and use its value.
        relations = schema.relationalProperties
    } else {
        // If it's not a Object, we throw an exception to let the user know
        // what's what.
        throw new Error(
            `relationalProperties is not an object in ${canonicalRef}`
        )
    }
    // Lastly, we generate the type attribute and return it, which requires a bit of
    // ceremony.  A producer is allowed to return more than one type attribute, so to
    // know which attribute corresponds to which attribute kind, it needs to be wrapped
    // in a "Map", which is what "makeAttributes" does.  The "forType" specifies that
    // these attributes go on the actual types specified in the schema.  We won't go
    // into the other possibilities here.
    return {
        forType: exports.relationTypeAttributeKind.makeAttributes(relations),
    }
}
exports.relationAttributeProducer = relationAttributeProducer
//# sourceMappingURL=RelationTypeAttributeKind.js.map
