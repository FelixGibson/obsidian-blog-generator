import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder, TAbstractFile } from 'obsidian';
import { generateBlogContent, generateTitle } from './blogContent';
import { appIcon } from './icon/appicon';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		appIcon();
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.openBlog();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				this.openBlog();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		this.app.workspace.on("file-menu", (menu, fileish: TAbstractFile) => {
			if (fileish instanceof TFile && fileish.extension === "md") {
				menu.addItem((item) => {
					item.setTitle("Publish to github")
						.setIcon("SpacedRepIcon")
						.onClick(() => {

						});
				});
			}
		})
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	public async openBlog(): Promise<void> {
		// const { inNewSplit = false, calendarSet } = opts ?? {};
		const { workspace } = this.app;
		// let file = this.cache.getPeriodicNote(
		//   calendarSet ?? this.calendarSetManager.getActiveId(),
		//   granularity,
		//   date
		// );
		// if (!file) {
		//   file = await this.createPeriodicNote(granularity, date);
		// }
		//get current date in YYYY-MM-DD format
		const date = new Date().toISOString().split("T")[0];
		const filePath = "blog/" + date + ".md";
		let file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
		if (file == null) {
			const [titleArray, content] = await generateBlogContent(this.app);
			const title = generateTitle(titleArray);

			//date and time format: YYYY-MM-DD HH:MM and hour need to be 24-hour format
			const date = new Date().toISOString().split("T")[0];
			let time = new Date().toISOString().split("T")[1].split(".")[0];
			// do not need seconds
			time = time.split(":")[0] + ":" + time.split(":")[1];

			const config = `---\ntitle: "${title}"\ndate: ${date} ${time}\n---\n\n`;

			file = await this.app.vault.create(filePath, config + content);
			const leaf = workspace.getUnpinnedLeaf();
			await leaf.openFile(file, { active: true });
		} else {
			let [titleArray, content] = await generateBlogContent(this.app);
			let fileText: string = await this.app.vault.read(file);
			const preTitles = fileText.match(/(?<=### ).+$/gm);
			titleArray = [...preTitles, ...titleArray];
			fileText = fileText.replace(/(?<=title: )".+"$/gm, "\"" + generateTitle(titleArray) + "\"");
			await this.app.vault.modify(file, fileText + "\n" + content);
			const leaf = workspace.getUnpinnedLeaf();
			await leaf.openFile(file, { active: true });

			
		}
		
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
