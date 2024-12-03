import { parseSync as p } from "oxc-parser";
import { readFileSync as u } from "fs";
import { ResolverFactory as m } from "oxc-resolver";
const y = (t) => {
  const e = t.split("/");
  return e[e.length - 1];
}, d = (t, e) => {
  const { sourceType: o, body: r } = t.program, n = o.language, a = r.reduce((s, c) => {
    if (c.type === "ImportDeclaration") {
      const { source: l } = c, { value: i } = l;
      s.push({ from: i });
    }
    return s;
  }, []);
  return {
    name: e,
    lang: n,
    dependencies: a
  };
}, F = (t) => {
  const e = y(t), o = { sourceFilename: e }, r = u(t, "utf8"), n = p(r, o);
  return d(n, e);
}, f = new m(), g = (t, e) => f.sync(t, e), h = async (t) => {
  const e = g(process.cwd(), t.entry);
  if (!e.path)
    return;
  const o = await F(e.path);
  console.log(o);
};
h({
  entry: "./demo/src/index.ts"
});
