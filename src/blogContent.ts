// require('dotenv').config();
import * as fs from 'fs';
import { parse, escapeRegex, CardType } from './parser';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, TAbstractFile } from 'obsidian';



const config: [string, string, string, string, boolean, boolean, string[]] = [
	";;",
	";;;",
	"?",
	"??",
	true,
	true,
	["#[[blog]]"],
];


// //recursive read all markdown file in a folder
// function readAllMD(dir: string) {
//   let results: string[] = [];
//   let list = fs.readdirSync(dir);
//   list.forEach(function(file) {
//     file = dir + '/' + file;
//     let stat = fs.statSync(file);
//     if (stat && stat.isDirectory()) {
//       /* Recurse into a subdirectory */
//       results = results.concat(readAllMD(file));
//     } else {
//       /* Is a file */
//       if (file.indexOf('.md') !== -1) {
//         results.push(file);
//       }
//     }
//   });
//   return results;
// }



async function replaceTag(files: TFile[], app: App) {
  for (const file of files) {
	const fileText: string = await app.vault.read(file);
    const newFileText = fileText.replaceAll(new RegExp(escapeRegex(config[6][0]), 'g'), '#[[blog_old]]');
	await this.app.vault.modify(file, newFileText);
  }
}

export async function generateBlogContent(app: App): Promise<[string[], string]> {
	//iterate array
	const files: TFile[] = app.vault.getMarkdownFiles();
	//An array of [CardType, card text, line number, file path] tuples
	const card: [CardType, string, number, TFile][] = [];
	let blogContent = '';
	const titleArray = [];
	for (const file of files) {
		//read file content
		const content: string = await this.app.vault.read(file);
		//parse content
		const ret: [CardType, string, number, string[]][] = parse(content, ...config);
		//iterate array
		let preTitle = '';
		for (const [type, text, line, tags] of ret) {
			for (const tag of tags) {
				if (tag === config[6][0]) {
					//remove all tag from text
					let newText = text.replaceAll(/ #\S+/gm, '');
					newText = newText.replaceAll(config[0], '');
					newText = newText.replaceAll(/<!--SR:!\S+-->/gm, '');
					const multilineRegex = new RegExp(`^[\\t ]*${escapeRegex(config[2])}[ ]*\n`, "gm");
					newText = newText.replaceAll(multilineRegex, '');
					newText = newText.replaceAll(/^[\t ]*- /gm, '');
					newText = newText.replaceAll(/(?<=^)/gm, '>');
					//extract regex
					const reg = /(?<=\s)ps.[\S ]+$/gm;
					const mainContent = newText.match(reg);
					if (mainContent) {
						newText = newText.replaceAll(reg, '');
						let tmp = mainContent[0];
						tmp = tmp.replaceAll("ps.", "");
						newText = tmp + "\n" + newText;
					}

					//get file title and remove suffix
					const title = file.path.split('/').pop().replace('.md', '');
					if (title !== preTitle) {
						titleArray.push(title);
						blogContent += `### ${title}\n${newText}\n\n`;
					} else {
						blogContent += `${newText}\n\n`;
					}
					preTitle = title;
					card.push([type, text, line, file]);
				}
			}
		}
	}
	const allFiles = [...new Set(card.map(x => x[3]))];
	await replaceTag(allFiles, app);

	return [titleArray, blogContent];
}

export function generateTitle(titleArray: string[]) {
	let retTitle = '';

	if (titleArray.length > 2) {
		// three title combine to one
		retTitle = titleArray[0] + ',' + titleArray[1] + '和' + titleArray[2];
	} else {
		retTitle = titleArray.join('和');
	}
	return retTitle;
}


