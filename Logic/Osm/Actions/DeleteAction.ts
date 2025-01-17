import { OsmObject } from "../OsmObject"
import OsmChangeAction from "./OsmChangeAction"
import { Changes } from "../Changes"
import { ChangeDescription } from "./ChangeDescription"
import ChangeTagAction from "./ChangeTagAction"
import {TagsFilter} from "../../Tags/TagsFilter"
import {And} from "../../Tags/And"
import {Tag} from "../../Tags/Tag"
import {OsmId} from "../../../Models/OsmFeature";
import { Utils } from "../../../Utils"

export default class DeleteAction extends OsmChangeAction {
    private readonly _softDeletionTags: TagsFilter
    private readonly meta: {
        theme: string
        specialMotivation: string
        changeType: "deletion"
    }
    private readonly _id: OsmId
    private readonly _hardDelete: boolean


    constructor(
        id: OsmId,
        softDeletionTags: TagsFilter | undefined,
        meta: {
            theme: string
            specialMotivation: string
        },
        hardDelete: boolean
    ) {
        super(id, true)
        this._id = id
        this._hardDelete = hardDelete
        this.meta = { ...meta, changeType: "deletion" }
        if (softDeletionTags?.usedKeys()?.indexOf("fixme") >= 0) {
            this._softDeletionTags = softDeletionTags
        } else {
            this._softDeletionTags = new And(
                Utils.NoNull([
                    softDeletionTags,
                new Tag(
                    "fixme",
                    `A mapcomplete user marked this feature to be deleted (${meta.specialMotivation})`
                )
            ]))
        }
    }
    /**
     *
     * import {OsmNode} from "../OsmObject"
     *
     * const obj : OsmNode= new OsmNode(1)
     * obj.tags = {id:"node/1",name:"Monte Piselli - San Giacomo"}
     * const da = new DeleteAction("node/1", new Tag("man_made",""), {theme: "test", specialMotivation: "Testcase"}, true)
     * const descr = await da.CreateChangeDescriptions(new Changes(), obj)
     * descr[0] // => {doDelete: true, meta: {theme: "test", specialMotivation: "Testcase",changeType: "deletion"}, type: "node",id: 1 }
     *
     * // Must not crash if softDeletionTags are undefined
     * const da = new DeleteAction("node/1", undefined, {theme: "test", specialMotivation: "Testcase"}, true)
     * const obj : OsmNode= new OsmNode(1)
     * obj.tags = {id:"node/1",name:"Monte Piselli - San Giacomo"}
     * const descr = await da.CreateChangeDescriptions(new Changes(), obj)
     * descr[0] // => {doDelete: true, meta: {theme: "test", specialMotivation: "Testcase", changeType: "deletion"}, type: "node",id: 1 }
     */
    public async CreateChangeDescriptions(changes: Changes, object?: OsmObject): Promise<ChangeDescription[]> {
        const osmObject = object ?? await OsmObject.DownloadObjectAsync(this._id)

        if (this._hardDelete) {
            return [
                {
                    meta: this.meta,
                    doDelete: true,
                    type: osmObject.type,
                    id: osmObject.id,
                },
            ]
        } else {
            return await new ChangeTagAction(this._id, this._softDeletionTags, osmObject.tags, {
                ...this.meta,
                changeType: "soft-delete",
            }).CreateChangeDescriptions(changes)
        }
    }
}
