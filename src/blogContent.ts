// require('dotenv').config();
import * as fs from 'fs';
import { parse, escapeRegex, CardType } from './parser';

// const folder = '/home/jjtom/Dropbox2/Dropbox/logseq-obsidian-off1';
const folder = '/home/jjtom/software/obsidian-test/obsidian-test1/test';

const config: [string, string, string, string, boolean, boolean, string[]] = [
    ";;",
    ";;;",
    "?",
    "??",
    true,
    true,
    ["#[[blog]]"],
];


//recursive read all markdown file in a folder
function readAllMD(dir: string) {
  let results: string[] = [];
  let list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    let stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(readAllMD(file));
    } else {
      /* Is a file */
      if (file.indexOf('.md') !== -1) {
        results.push(file);
      }
    }
  });
  return results;
}



function replaceTag(files: string[]) {
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const newContent = content.replaceAll(new RegExp(escapeRegex(config[6][0]), 'g'), '#[[blog_old]]');
    fs.writeFileSync(file, newContent);
  }
}

export function generateBlogContent() {
  //iterate array
  const files = readAllMD(folder);
  //An array of [CardType, card text, line number, file path] tuples
  const card:[CardType, string, number, string][] = [];
  let blogContent = '';
  for (const file of files) {
      //read file content
      const content = fs.readFileSync(file, 'utf8');
      //parse content
      const ret:[CardType, string, number, string[]][] = parse(content, ...config);
      //iterate array
      for (const [type, text, line, tags] of ret) {
          for (const tag of tags) {
              if (tag === config[6][0]) {
				//remove all tag from text
				let newText = text.replaceAll(/ #\S+/gm, '');
				newText = newText.replaceAll(config[0], '');
				blogContent += `${newText}  ${file}\n`;
                card.push([type, text, line, file]);
              }
          }
      }
  }
  return blogContent;
//   let allFiles = [...new Set(card.map(x => x[3]))];
//   replaceTag(allFiles);
}


