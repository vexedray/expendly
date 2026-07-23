const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const sourceRoots = ['src', 'test'];

function listTypeScriptFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) return listTypeScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.ts') ? [entryPath] : [];
  });
}

function indentationAt(source, position) {
  const lineStart = source.lastIndexOf('\n', position - 1) + 1;
  return source.slice(lineStart, position).match(/^\s*/)[0];
}

function memberContentStart(member, sourceFile) {
  const starts = [];
  const modifiers = ts.getModifiers(member) ?? [];

  for (const modifier of modifiers) starts.push(modifier.getStart(sourceFile));
  if (member.name) starts.push(member.name.getStart(sourceFile));
  if (member.asteriskToken) starts.push(member.asteriskToken.getStart(sourceFile));

  return starts.length > 0 ? Math.min(...starts) : member.end;
}

function formatDecoratedMembers(source, sourceFile) {
  const edits = [];

  function visit(node) {
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      node.members.forEach((member, memberIndex) => {
        const decorators = ts.canHaveDecorators(member) ? (ts.getDecorators(member) ?? []) : [];
        const memberStart =
          decorators.length > 0 ? decorators[0].getStart(sourceFile) : member.getStart(sourceFile);

        if (memberIndex > 0) {
          const previousMember = node.members[memberIndex - 1];
          const betweenMembers = source.slice(previousMember.end, memberStart);

          if (/^\s*$/.test(betweenMembers) && (betweenMembers.match(/\n/g) ?? []).length < 2) {
            edits.push({
              start: previousMember.end,
              end: memberStart,
              text: `\n\n${indentationAt(source, memberStart)}`,
            });
          }
        }

        decorators.forEach((decorator, decoratorIndex) => {
          const nextStart =
            decoratorIndex + 1 < decorators.length
              ? decorators[decoratorIndex + 1].getStart(sourceFile)
              : memberContentStart(member, sourceFile);
          const between = source.slice(decorator.end, nextStart);

          if (/^[ \t]*$/.test(between)) {
            edits.push({
              start: decorator.end,
              end: nextStart,
              text: `\n${indentationAt(source, memberStart)}`,
            });
          }
        });
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return edits
    .sort((left, right) => right.start - left.start)
    .reduce(
      (formatted, edit) =>
        `${formatted.slice(0, edit.start)}${edit.text}${formatted.slice(edit.end)}`,
      source,
    );
}

const files = sourceRoots.flatMap((root) => listTypeScriptFiles(path.join(projectRoot, root)));
let changedFiles = 0;

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const formatted = formatDecoratedMembers(source, sourceFile);

  if (formatted !== source) {
    fs.writeFileSync(file, formatted);
    changedFiles += 1;
  }
}

console.log(`TypeScript readability pass: ${changedFiles} file(s) updated.`);
