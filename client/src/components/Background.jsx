export default function Background() {
  return (
    <div className="bgScene" aria-hidden="true">
      <input type="checkbox" id="gfxmenu" />
      <input type="radio" name="gfx" id="good" defaultChecked />
      <input type="radio" name="gfx" id="poor" />
      <x id="graphics">
        <label className="gfx" htmlFor="gfxmenu">Graphics Quality</label>
        <label className="gfx" htmlFor="good">Very Pretty</label>
        <label className="gfx" htmlFor="poor">Quite Pretty</label>
      </x>

      <sky>
        <time>
          <sun></sun>
        </time>
      </sky>
      <stars>
        <i></i>
      </stars>

      <sunset></sunset>

      <colour>
        <div className="main">
          <island></island>
        </div>
      </colour>
    </div>
  );
}
