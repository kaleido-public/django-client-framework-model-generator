import {
    swiftOptions,
    SwiftRenderer,
    SwiftTargetLanguage,
    getOptionValues,
    RenderContext,
    Namer,
    ClassType,
    Name,
    Type,
    Sourcelike,
    ClassProperty,
} from "quicktype/dist/quicktype-core"

import {
    RelationManagerSet,
    relationTypeAttributeKind,
} from "./RelationTypeAttributeKind"

export class SwiftXTargetLanguage extends SwiftTargetLanguage {
    protected makeRenderer(
        renderContext: RenderContext,
        untypedOptionValues: { [name: string]: any }
    ): SwiftRenderer {
        return new SwiftXRenderer(
            this,
            renderContext,
            getOptionValues(swiftOptions, untypedOptionValues)
        )
    }
}

export class SwiftXRenderer extends SwiftRenderer {
    identity_namer = new Namer("identity", (name) => name, [])

    protected namerForObjectProperty(): Namer {
        return this.identity_namer
    }

    protected makeUnionMemberNamer(): Namer {
        return this.identity_namer
    }

    protected makeEnumCaseNamer(): Namer {
        return this.identity_namer
    }

    protected renderSingleFileHeaderComments(): void {
        this.emitLineOnce(
            "// This file was generated from JSON Schema using quicktype, do not modify it directly."
        )
    }

    protected emitMark(line: Sourcelike, horizontalLine: boolean = false) {}

    protected getProtocolString(_t: Type, isClass: boolean): Sourcelike {
        return ": Model"
    }
    protected renderClassDefinition(c: ClassType, className: Name): void {
        this.startFile(className)

        this.renderHeader(c, className)
        this.emitDescription(this.descriptionForType(c))

        this.emitMark(this.sourcelikeToString(className), true)

        const isClass = this._options.useClasses || this.isCycleBreakerType(c)
        const structOrClass = isClass ? "class" : "struct"

        if (isClass && this._options.objcSupport) {
            // [Michael Fey (@MrRooni), 2019-4-24] Swift 5 or greater, must come before the access declaration for the class.
            this.emitItem(this.objcMembersDeclaration)
        }

        this.emitBlockWithAccess(
            [structOrClass, " ", className, this.getProtocolString(c, isClass)],
            () => {
                this.forEachClassProperty(c, "none", (name, jsonName, p) => {
                    const description = this.descriptionForClassProperty(
                        c,
                        jsonName
                    )
                    const propertyLines = this.propertyLinesDefinitionX(
                        jsonName,
                        name,
                        p
                    )
                    this.emitDescription(description)
                    this.emitLine(propertyLines)
                })
                this.emitRelationManagers(c, className)
            }
        )

        this.endFile()
    }

    protected propertyLinesDefinitionX(
        jsonName: string,
        name: Name,
        parameter: ClassProperty
    ): Sourcelike {
        if (jsonName == "id") {
            return [this.accessLevel, "let id: UInt"]
        }
        return [
            this.accessLevel,
            "var ",
            name,
            ": ",
            this.swiftPropertyType(parameter),
        ]
    }

    protected emitRelationManagers(c: ClassType, className: Name): void {
        // All the type's attributes
        const attributes = c.getAttributes()
        // The game object attribute, or "undefined"
        const relation_managers = relationTypeAttributeKind.tryGetInAttributes(
            attributes
        )
        for (const key in relation_managers) {
            const type = relation_managers[key].type
            const to = relation_managers[key].to
            let manager: string
            if (["ManyToManyRel", "ManyToOneRel"].includes(type)) {
                manager = "RelatedCollectionManager"
            } else {
                manager = "RelatedObjectManager"
            }
            this.emitLine(
                `var ${key}: ${manager}<${to}, `,
                className,
                `> { .init(id, "${key}") }`
            )
        }
    }
}
