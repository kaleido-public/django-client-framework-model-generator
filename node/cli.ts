import * as fs from "fs";

import {
  quicktype,
  InputData,
  JSONSchemaInput,
  TargetLanguage,
} from "quicktype-core";
import {
  KotlinXTargetLanguage,
  relationAttributeProducer,
} from "./KotlinXTargetLanguage";

async function main(program: string, args: string[]): Promise<void> {
  // Exactly one command line argument allowed, the name of the JSON Schema file.
  if (args.length < 2) {
    console.error(`Usage: ${program} {kotlin|...} SCHEMAS...`);
    process.exit(1);
  }

  const language = args[0];
  const schemas = args.slice(1);

  // The "InputData" holds all the sources of type information that we give to quicktype.
  const inputData = new InputData();
  for (const fp of schemas) {
    const schema_text = fs.readFileSync(fp, "utf8");
    const schema = JSON.parse(schema_text);
    const source = { name: schema.title, schema: schema_text };
    // "JSONSchemaInput" is the class that reads JSON Schema and converts it into quicktype's
    // internal type representation (see https://blog.quicktype.io/under-the-hood/ for a
    // semi-outdated but still useful introduction to the IR).
    // The "source" object is in the form that "JSONSchemaInput" needs.
    await inputData.addSource(
      "schema",
      source,
      () => new JSONSchemaInput(undefined, [relationAttributeProducer])
    );
  }

  // "CSharpTargetLanguage" is the class for basic C# types.  Its subclass
  // "NewtonsoftCSharpTargetLanguage" also produces attributes for Newtonsoft's Json.NET,
  // but we don't need those for our game, so we work with the base class directly.
  // Because it's not specialized we have to give it three arguments, none of which are
  // actually needed in our simple application: The "display name" of the language, an
  // array of names by which we could specify it, were we using quicktype's CLI, and the
  // file extension for the language.
  let lang: TargetLanguage;
  switch (language) {
    case "kotlin":
      lang = new KotlinXTargetLanguage();
      break;
    default:
      console.error(`Not a valid language: ${language}`);
      process.exit(1);
  }

  // What we get back from running "quicktype" is the source code as an array of lines.
  const { lines } = await quicktype({ lang, inputData });

  for (const line of lines) {
    console.log(line);
  }
}

main(process.argv[1], process.argv.slice(2));
