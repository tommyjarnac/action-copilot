import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface ActionCopilotPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: ActionCopilotPluginSettings = {
	mySetting: 'default'
}

export default class ActionCopilotPlugin extends Plugin {
	settings: ActionCopilotPluginSettings;


  	async fetchDataFromAPI(text) {
        // Use fetch or any other method to fetch data from your local API
        const response = await requestUrl({
        	url: this.settings.serverUrl + '/suggest',
        	method: 'POST',
        	'headers': {'Content-Type': 'application/json'},
        	'body': JSON.stringify({'content': text})
        	});
        const data = await response.json;
        return data;
    }


	async onload() {
		await this.loadSettings();


		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'action-copilot-modal',
			name: 'Action Copilot Modal',
			callback: () => {
				new ActionCopilotModal(this.app, this).open();
			}
		});
		

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ActionCopilotSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class ActionCopilotModal extends Modal {
	plugin: ActionCopilotPlugin;
	constructor(app: App, plugin: ActionCopilotPlugin) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
    const { contentEl } = this;

    const noteFile = this.app.workspace.getActiveFile();
    if (!noteFile.name) return;

    let text = await this.app.vault.read(noteFile);
 
	// Show waiting animation
	const waitingEl = contentEl.createEl('p');
	waitingEl.setText('Waiting');

	// Define a function to update the waiting animation
	function updateWaitingAnimation() {
	    setTimeout(() => {
	        if (!waitingEl) return; // Check if the waiting element still exists
	        const text = waitingEl.getText();
	        waitingEl.setText(text === 'Waiting...' ? 'Waiting' : text + '.');
	        updateWaitingAnimation(); // Recursively call the function to continue updating the animation
	    }, 500); // Update every 500 milliseconds (adjust as needed)
	}

	// Start updating the waiting animation
	updateWaitingAnimation();
    
    const data = await this.plugin.fetchDataFromAPI(text);
    contentEl.empty();

    const titleEl = contentEl.createEl('h1');
    titleEl.setText('Task Finder');

    // Create table
    const tableEl = contentEl.createEl('table');
    const headerRow = tableEl.createEl('tr');
    ['Title', 'Priority', 'Description', 'Related Text', 'Action'].forEach(headerText => {
        const headerCell = headerRow.createEl('th');
        headerCell.setText(headerText);
    });

    // Add tasks to table
    data.forEach((task: any) => {
        const taskRow = tableEl.createEl('tr');

        // Add task attributes to table cells
        ['title', 'priority', 'description', 'related_text'].forEach(attribute => {
            const taskCell = taskRow.createEl('td');
            taskCell.setText(task[attribute] || '-'); // If attribute is undefined, display '-'
        });

        // Add action column with create link
        const actionCell = taskRow.createEl('td');
        const taskLink = actionCell.createEl('a');
        taskLink.setText('Create');
        taskLink.setAttribute('href', this.plugin.settings.serverUrl + '/tasks');
        taskLink.addEventListener('click', async (event) => {
            event.preventDefault();
            const response = await requestUrl({
                url: this.plugin.settings.serverUrl + '/tasks/',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: task.title,
                    note_link: 'obsidian://open?vault=' + this.app.vault.getName() + '&file=' + noteFile.basename,
                    priority: task.priority,
                    description: task.description,
                    related_text: task.related_text
                })
            });
            if (response.status == 200) {
                new Notice('Task created successfully');
            } else {
                const errorMessage = await response.text();
                new Notice(`Error creating task: ${errorMessage}`);
            }
        });
    });
}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class ActionCopilotSettingTab extends PluginSettingTab {
	plugin: ActionCopilotPlugin;

	constructor(app: App, plugin: ActionCopilotPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Task server URL')
			.setDesc('to receive this plugin requests')
			.addText(text => text
				.setPlaceholder('http://localhost:8000')
				.setValue(this.plugin.settings.serverUrl)
				.onChange(async (value) => {
					this.plugin.settings.serverUrl = value;
					await this.plugin.saveSettings();
				}));
	}
}
