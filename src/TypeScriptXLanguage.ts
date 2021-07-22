import {
    TypeScriptRenderer,
    TypeScriptTargetLanguage,
    getOptionValues,
    RenderContext,
    Namer,
    tsFlowOptions,
    ClassType,
    Name,
    modifySource,
    EnumType,
} from "quicktype/dist/quicktype-core"
import { utf16StringEscape } from "quicktype/dist/quicktype-core/support/Strings"

import { relationTypeAttributeKind } from "./RelationTypeAttributeKind"

export class TypeScriptXTargetLanguage extends TypeScriptTargetLanguage {
    protected makeRenderer(
        renderContext: RenderContext,
        untypedOptionValues: { [name: string]: any }
    ): TypeScriptRenderer {
        return new TypeScriptXRenderer(
            this,
            renderContext,
            getOptionValues(tsFlowOptions, untypedOptionValues)
        )
    }
}

export class TypeScriptXRenderer extends TypeScriptRenderer {
    identity_namer = new Namer("identity", (name) => name, [])

    protected emitSourceStructure() {
        if (this.leadingComments !== undefined) {
            this.emitCommentLines(this.leadingComments)
        } else {
            this.emitUsageComments()
        }

        this.emitModuleImports()

        this.emitTypes()

        this.emitConvertModule()

        this.emitConvertModuleHelpers()

        this.emitModuleExports()
    }

    protected namerForObjectProperty(): Namer {
        return this.identity_namer
    }

    protected makeEnumCaseNamer(): Namer {
        return this.identity_namer
    }

    protected emitClassBlock(c: ClassType, className: Name): void {
        this.emitBlock(
            ["export class ", className, " extends d.Model "],
            "",
            () => {
                this.emitClassBlockBody(c, className)
                this.emitRelationManagers(c, className)
                this.emitCollectionManager(c, className)
            }
        )
    }

    protected emitClassBlockBody(c: ClassType, className?: Name): void {
        this.emitLine('_model_name = "', className!, '"')
        this.emitPropertyTable(c, (name, _jsonName, p) => {
            const t = p.type
            return [
                [name, p.isOptional ? "?" : "!", ": "],
                [this.sourceFor(t).source, ";"],
            ]
        })
    }

    protected emitCollectionManager(c: ClassType, className: Name): void {
        this.emitLine(
            "static objects = new d.CollectionManager(",
            className,
            ")"
        )
    }

    protected emitRelationManagers(c: ClassType, className: Name): void {
        // All the type's attributes
        const attributes = c.getAttributes()
        const relation_managers =
            relationTypeAttributeKind.tryGetInAttributes(attributes)
        for (const key in relation_managers) {
            const type = relation_managers[key].type
            const to = relation_managers[key].to
            let manager: string
            if (["ManyToManyRel", "ManyToOneRel"].includes(type)) {
                manager = "d.RelatedCollectionManager"
            } else {
                manager = "d.RelatedObjectManager"
            }
            this.emitLine(
                `get ${key}(): ${manager}<s.${to}, `,
                className,
                `> { return new ${manager}(s.${to}, this, "${key}") }`
            )
        }
    }

    protected emitEnum(e: EnumType, enumName: Name): void {
        this.emitDescription(this.descriptionForType(e))
        this.emitBlock(["enum ", enumName, " "], "", () => {
            this.forEachEnumCase(e, "none", (name, jsonName) => {
                this.emitLine(name, ` = "${utf16StringEscape(jsonName)}",`)
            })
        })
    }

    protected emitModuleImports() {
        this.emitLine("import * as d from 'django-client-framework'")
        this.emitLine("import * as s from '.'")
    }
}
