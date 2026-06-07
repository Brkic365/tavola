import { BUNDLED_GLB, BUNDLED_USDZ } from "@/lib/bundledModels";
import { KNOWN_DIETARY } from "@/lib/dietary";
import DimensionMeasurer from "@/components/admin/DimensionMeasurer";
import UsdzGenerator from "@/components/admin/UsdzGenerator";

type DishDefaults = {
  name?: string;
  description?: string | null;
  price?: number;
  glbUrl?: string;
  usdzUrl?: string | null;
  thumbnailUrl?: string | null;
  widthCm?: number | null;
  depthCm?: number | null;
  heightCm?: number | null;
  weightG?: number | null;
  serves?: string | null;
  allergens?: string | null;
  calories?: number | null;
  dietary?: string | null;
  featured?: boolean;
  categoryId?: string | null;
  modelWidthCm?: number | null;
  modelDepthCm?: number | null;
  modelHeightCm?: number | null;
};

const inputCls =
  "mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";
const labelCls = "block text-sm font-medium text-stone-700";

function v(value: string | number | null | undefined): string | number {
  if (value === null || value === undefined) return "";
  return value;
}

/**
 * Shared field set for create + edit dish forms. The parent wraps these in a
 * <form action={createDish|updateDish}> and adds hidden restaurantId/slug/id.
 */
export default function DishFormFields({
  dish,
  categories,
  idPrefix,
}: {
  dish?: DishDefaults;
  categories: { id: string; name: string }[];
  idPrefix: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="col-span-2">
        <span className={labelCls}>Name *</span>
        <input
          name="name"
          required
          defaultValue={v(dish?.name) as string}
          className={inputCls}
          placeholder="Crni rižot"
        />
      </label>

      <label>
        <span className={labelCls}>Category</span>
        <select
          name="categoryId"
          defaultValue={dish?.categoryId ?? ""}
          className={inputCls}
        >
          <option value="">— Uncategorized —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className={labelCls}>Price</span>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={v(dish?.price)}
          className={inputCls}
          placeholder="18.00"
        />
      </label>

      <label className="col-span-2">
        <span className={labelCls}>Description</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={v(dish?.description) as string}
          className={inputCls}
          placeholder="Short, appetizing description"
        />
      </label>

      <label className="col-span-2">
        <span className={labelCls}>GLB model URL * (3D + Android AR)</span>
        <input
          id={`${idPrefix}-glbUrl`}
          name="glbUrl"
          required
          list={`${idPrefix}-glb`}
          defaultValue={v(dish?.glbUrl) as string}
          className={inputCls}
          placeholder="/models/avocado.glb"
        />
        <datalist id={`${idPrefix}-glb`}>
          {BUNDLED_GLB.map((m) => (
            <option key={m.url} value={m.url}>
              {m.label}
            </option>
          ))}
        </datalist>
      </label>

      <div className="col-span-2">
        <label>
          <span className={labelCls}>USDZ model URL (iOS AR — optional)</span>
          <input
            id={`${idPrefix}-usdzUrl`}
            name="usdzUrl"
            list={`${idPrefix}-usdz`}
            defaultValue={v(dish?.usdzUrl) as string}
            className={inputCls}
            placeholder="/models/astronaut.usdz (leave blank → iOS AR disabled)"
          />
          <datalist id={`${idPrefix}-usdz`}>
            {BUNDLED_USDZ.map((m) => (
              <option key={m.url} value={m.url}>
                {m.label}
              </option>
            ))}
          </datalist>
        </label>
        {/* One-tap GLB→USDZ conversion so iOS Quick Look works for this dish. */}
        <UsdzGenerator idPrefix={idPrefix} />
      </div>

      <label className="col-span-2">
        <span className={labelCls}>Thumbnail URL (optional)</span>
        <input
          name="thumbnailUrl"
          defaultValue={v(dish?.thumbnailUrl) as string}
          className={inputCls}
          placeholder="Leave blank for an auto gradient + emoji"
        />
      </label>

      <fieldset className="col-span-2 grid grid-cols-4 gap-3">
        <label>
          <span className={labelCls}>Width (cm)</span>
          <input
            id={`${idPrefix}-widthCm`}
            name="widthCm"
            type="number"
            step="0.1"
            min="0"
            defaultValue={v(dish?.widthCm)}
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Depth (cm)</span>
          <input
            id={`${idPrefix}-depthCm`}
            name="depthCm"
            type="number"
            step="0.1"
            min="0"
            defaultValue={v(dish?.depthCm)}
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Height (cm)</span>
          <input
            id={`${idPrefix}-heightCm`}
            name="heightCm"
            type="number"
            step="0.1"
            min="0"
            defaultValue={v(dish?.heightCm)}
            className={inputCls}
          />
        </label>
        <label>
          <span className={labelCls}>Weight (g)</span>
          <input
            name="weightG"
            type="number"
            step="1"
            min="0"
            defaultValue={v(dish?.weightG)}
            className={inputCls}
          />
        </label>
      </fieldset>

      {/* True-to-scale check: measure the GLB's real size and compare it to the
          stated dimensions. Hidden inputs carry the measurement to the server. */}
      <div className="col-span-2">
        <DimensionMeasurer
          idPrefix={idPrefix}
          initialModel={{
            w: dish?.modelWidthCm ?? null,
            d: dish?.modelDepthCm ?? null,
            h: dish?.modelHeightCm ?? null,
          }}
        />
        <input
          type="hidden"
          id={`${idPrefix}-modelWidthCm`}
          name="modelWidthCm"
          defaultValue={v(dish?.modelWidthCm)}
        />
        <input
          type="hidden"
          id={`${idPrefix}-modelDepthCm`}
          name="modelDepthCm"
          defaultValue={v(dish?.modelDepthCm)}
        />
        <input
          type="hidden"
          id={`${idPrefix}-modelHeightCm`}
          name="modelHeightCm"
          defaultValue={v(dish?.modelHeightCm)}
        />
      </div>

      <label>
        <span className={labelCls}>Serves</span>
        <input
          name="serves"
          defaultValue={v(dish?.serves) as string}
          className={inputCls}
          placeholder="1-2"
        />
      </label>

      <label>
        <span className={labelCls}>Calories (kcal / portion)</span>
        <input
          name="calories"
          type="number"
          step="1"
          min="0"
          defaultValue={v(dish?.calories)}
          className={inputCls}
          placeholder="480"
        />
      </label>

      <label>
        <span className={labelCls}>Allergens (comma-separated)</span>
        <input
          name="allergens"
          defaultValue={v(dish?.allergens) as string}
          className={inputCls}
          placeholder="gluten,shellfish"
        />
      </label>

      <label>
        <span className={labelCls}>Dietary tags (comma-separated)</span>
        <input
          name="dietary"
          list={`${idPrefix}-dietary`}
          defaultValue={v(dish?.dietary) as string}
          className={inputCls}
          placeholder="vegetarian,gluten-free"
        />
        <datalist id={`${idPrefix}-dietary`}>
          {KNOWN_DIETARY.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </datalist>
      </label>

      <label className="col-span-2 flex items-center gap-2">
        <input
          name="featured"
          type="checkbox"
          defaultChecked={dish?.featured ?? false}
          className="h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
        />
        <span className="text-sm font-medium text-stone-700">
          Feature this dish (Chef&apos;s pick)
        </span>
      </label>
    </div>
  );
}
