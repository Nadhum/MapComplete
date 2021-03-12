import {UIElement} from "../UIElement";
import {UIEventSource} from "../../Logic/UIEventSource";
import LayerConfig from "../../Customizations/JSON/LayerConfig";
import EditableTagRendering from "./EditableTagRendering";
import QuestionBox from "./QuestionBox";
import Combine from "../Base/Combine";
import TagRenderingAnswer from "./TagRenderingAnswer";
import State from "../../State";
import TagRenderingConfig from "../../Customizations/JSON/TagRenderingConfig";
import ScrollableFullScreen from "../Base/ScrollableFullScreen";
import {Utils} from "../../Utils";

export default class FeatureInfoBox extends ScrollableFullScreen {
    private static featureInfoboxCache: Map<LayerConfig, Map<UIEventSource<any>, FeatureInfoBox>> = new Map<LayerConfig, Map<UIEventSource<any>, FeatureInfoBox>>();

    private constructor(
        tags: UIEventSource<any>,
        layerConfig: LayerConfig
    ) {
        super((mode:string) => FeatureInfoBox.GenerateTitleBar(tags, layerConfig, mode),
            (mode:string) => FeatureInfoBox.GenerateContent(tags, layerConfig, mode));
       
        if (layerConfig === undefined) {
            throw "Undefined layerconfig";
        }

    }

    static construct(tags: UIEventSource<any>, layer: LayerConfig): FeatureInfoBox {
        let innerMap = Utils.getOrSetDefault(FeatureInfoBox.featureInfoboxCache, layer,() => new Map<UIEventSource<any>, FeatureInfoBox>())
        return Utils.getOrSetDefault(innerMap, tags, () => new FeatureInfoBox(tags, layer));
    }

    private static GenerateTitleBar(tags: UIEventSource<any>,
                                    layerConfig: LayerConfig): UIElement {
        const title = new TagRenderingAnswer(tags, layerConfig.title ?? new TagRenderingConfig("POI", undefined))
            .SetClass("break-words font-bold sm:p-0.5 md:p-1 sm:p-1.5 md:p-2");
        const titleIcons = new Combine(
            layerConfig.titleIcons.map(icon => new TagRenderingAnswer(tags, icon,
                "block w-8 h-8 align-baseline box-content sm:p-0.5", "width: 2rem !important;")
                .HideOnEmpty(true)
            ))
            .SetClass("flex flex-row flex-wrap pt-0.5 sm:pt-1 items-center mr-2")

        return new Combine([
            new Combine([title, titleIcons]).SetClass("flex flex-col sm:flex-row flex-grow justify-between")
        ])
    }

    private static GenerateContent(tags: UIEventSource<any>,
                                   layerConfig: LayerConfig,
                                   mode: string): UIElement {


        let questionBox: UIElement = undefined;
        if (State.state.featureSwitchUserbadge.data) {
            questionBox = new QuestionBox(tags, layerConfig.tagRenderings);
        }

        let questionBoxIsUsed = false;
        const renderings = layerConfig.tagRenderings.map(tr => {
            if (tr.question === null) {
                // This is the question box!
                questionBoxIsUsed = true;
                return questionBox;
            }
            return new EditableTagRendering(tags, tr);
        });
        if (!questionBoxIsUsed) {
            renderings.push(questionBox);
        }
        const tail = new Combine([]).SetClass("only-on-mobile");

        return new Combine([
                ...renderings,
                tail.SetClass("featureinfobox-tail")
            ]
        ).SetClass("block")

    }

}
