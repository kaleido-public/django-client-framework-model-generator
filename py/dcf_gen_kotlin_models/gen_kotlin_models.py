import click
from subprocess import run
from typing import List, Dict, Any, Set
from pathlib import Path
from functools import cached_property, reduce, partial
import re


class Analyzer:
    def __init__(self, json_schemas: List[str]):
        self.json_schemas = json_schemas
        self.cache = {}

    def iterate_json_schemas(self):
        for file in self.json_schemas:
            if file not in self.cache:
                self.cache[file] = Path(file).read_text()
            yield self.cache[file]

    @cached_property
    def model_names(self) -> Set[str]:
        return set(
            map(
                lambda x: x["properties"]["title"],
                self.iterate_json_schemas(),
            )
        )


def add_extend_model(quicktype_output: str):
    processors = [ModelMultiLines()]
    return "\n".join(
        [
            reduce(lambda l, p: p.process(l), processors, ln)
            for ln in quicktype_output.splitlines()
        ]
    )


class LineProcessor:
    def process(self, line: str) -> str:
        raise NotImplementedError()


class ModelMultiLines(LineProcessor):
    """
    For a data class defined in multiple lines such as:
        @Serializable
        data class Product (
            val barcode: String,
            val id: Long
        }
    the processor makes Product implement the Model interface,
    and add override to the id field.
    """

    def __init__(self):
        self.in_model_definition = False
        self.regex = re.compile(r"^data class \w+ \($")
        self.id_regex = re.compile(r"^(\s+)(val id: Long,?)$")

    def process(self, line: str) -> str:
        return reduce(
            lambda l, p: p(l),
            [self.extend_model, self.override_id],
            line,
        )

    def extend_model(self, line: str) -> str:
        if self.in_model_definition and line == ")":
            self.in_model_definition = False
            return "): Model"
        else:
            if self.regex.match(line):
                self.in_model_definition = True
            return line

    def override_id(self, line: str) -> str:
        if self.in_model_definition and self.id_regex.match(line):
            return self.id_regex.sub(r"\1override \2", line)
        else:
            return line


@click.command()
@click.argument(
    "json-schemas",
    nargs=-1,
    type=click.Path(file_okay=True, dir_okay=False),
    required=True,
)
def main(json_schemas):
    """
    Generate kotlin model files from json schemas.
    """
    quicktype_proc = run(
        [
            "quicktype",
            "--src-lang",
            "schema",
            "--lang",
            "kotlin",
            "--framework",
            "kotlinx",
            "--package",
            "django_client_framework",
            "--alphabetize-properties",
            "--telemetry",
            "disable",
            *json_schemas,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    quicktype_output = quicktype_proc.stdout
    output = add_extend_model(quicktype_output)
    print(output)


if __name__ == "__main__":
    main()
