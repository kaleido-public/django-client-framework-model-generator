#!/usr/bin/env node
"use strict"
var __createBinding =
    (this && this.__createBinding) ||
    (Object.create
        ? function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              Object.defineProperty(o, k2, {
                  enumerable: true,
                  get: function () {
                      return m[k]
                  },
              })
          }
        : function (o, m, k, k2) {
              if (k2 === undefined) k2 = k
              o[k2] = m[k]
          })
var __setModuleDefault =
    (this && this.__setModuleDefault) ||
    (Object.create
        ? function (o, v) {
              Object.defineProperty(o, "default", {
                  enumerable: true,
                  value: v,
              })
          }
        : function (o, v) {
              o["default"] = v
          })
var __importStar =
    (this && this.__importStar) ||
    function (mod) {
        if (mod && mod.__esModule) return mod
        var result = {}
        if (mod != null)
            for (var k in mod)
                if (
                    k !== "default" &&
                    Object.prototype.hasOwnProperty.call(mod, k)
                )
                    __createBinding(result, mod, k)
        __setModuleDefault(result, mod)
        return result
    }
Object.defineProperty(exports, "__esModule", { value: true })
const fs = __importStar(require("fs"))
const quicktype_core_1 = require("quicktype/dist/quicktype-core")
const KotlinXTargetLanguage_1 = require("./KotlinXTargetLanguage")
const RelationTypeAttributeKind_1 = require("./RelationTypeAttributeKind")
const SwiftXTargetLanguage_1 = require("./SwiftXTargetLanguage")
const TypeScriptXLanguage_1 = require("./TypeScriptXLanguage")
async function main(program, args) {
    // Exactly one command line argument allowed, the name of the JSON Schema file.
    if (args.length < 2) {
        console.error(`Usage: ${program} {kotlin|...} SCHEMAS...`)
        process.exit(1)
    }
    const language = args[0]
    const schemas = args.slice(1)
    // The "InputData" holds all the sources of type information that we give to quicktype.
    const inputData = new quicktype_core_1.InputData()
    for (const fp of schemas) {
        const schema_text = fs.readFileSync(fp, "utf8")
        const schema = JSON.parse(schema_text)
        const source = { name: schema.title, schema: schema_text }
        // "JSONSchemaInput" is the class that reads JSON Schema and converts it into quicktype's
        // internal type representation (see https://blog.quicktype.io/under-the-hood/ for a
        // semi-outdated but still useful introduction to the IR).
        // The "source" object is in the form that "JSONSchemaInput" needs.
        await inputData.addSource(
            "schema",
            source,
            () =>
                new quicktype_core_1.JSONSchemaInput(undefined, [
                    RelationTypeAttributeKind_1.relationAttributeProducer,
                ])
        )
    }
    // "CSharpTargetLanguage" is the class for basic C# types.  Its subclass
    // "NewtonsoftCSharpTargetLanguage" also produces attributes for Newtonsoft's Json.NET,
    // but we don't need those for our game, so we work with the base class directly.
    // Because it's not specialized we have to give it three arguments, none of which are
    // actually needed in our simple application: The "display name" of the language, an
    // array of names by which we could specify it, were we using quicktype's CLI, and the
    // file extension for the language.
    let lang
    let opts = {}
    switch (language) {
        case "kotlin":
            lang = new KotlinXTargetLanguage_1.KotlinXTargetLanguage()
            break
        case "swift":
            lang = new SwiftXTargetLanguage_1.SwiftXTargetLanguage()
            opts = {
                rendererOptions: {
                    "just-types": "true",
                    density: "normal",
                },
            }
            break
        case "typescript":
            lang = new TypeScriptXLanguage_1.TypeScriptXTargetLanguage()
            opts = {
                rendererOptions: {
                    "just-types": "true",
                },
            }
            break
        default:
            console.error(`Not a valid language: ${language}`)
            process.exit(1)
    }
    // What we get back from running "quicktype" is the source code as an array of lines.
    const { lines } = await quicktype_core_1.quicktype({
        lang,
        inputData,
        ...opts,
    })
    for (const line of lines) {
        console.log(line)
    }
}
main(process.argv[1], process.argv.slice(2))
//# sourceMappingURL=cli.js.map
