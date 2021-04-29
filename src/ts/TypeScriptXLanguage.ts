import {
    TypeScriptRenderer,
    TypeScriptTargetLanguage,
    getOptionValues,
    RenderContext,
    Namer,
    tsFlowOptions,
    ClassType,
    Name,
} from "quicktype/dist/quicktype-core"

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

    protected namerForObjectProperty(): Namer {
        return this.identity_namer
    }

    protected makeEnumCaseNamer(): Namer {
        return this.identity_namer
    }

    protected emitClassBlock(c: ClassType, className: Name): void {
        this.emitBlock(["export interface ", className, " extends Model "], "", () => {
            this.emitClassBlockBody(c)
        })
    }

    protected emitRelationManagers(c: ClassType, className: Name): void {
        // All the type's attributes
        const attributes = c.getAttributes()
        // The game object attribute, or "undefined"
        const relation_managers =
            relationTypeAttributeKind.tryGetInAttributes(attributes)
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
