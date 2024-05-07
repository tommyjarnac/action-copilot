import yaml

from todoist_api_python.api import TodoistAPI


with open("secrets.yaml", "r") as yaml_file:
    config = yaml.safe_load(yaml_file)
    if config["todoist"]:
        API_TOKEN = config["todoist"]["api-token"]
        PROJECT_ID = config["todoist"]["project-id"]

api = TodoistAPI(API_TOKEN)


def export(task):
    content = task.title
    description = "**description**: %s, \n\n**journal excerpt**: %s" % (
        task.description, task.related_text)
    if task.note_link:
        description += "**note_link**: %s" % (task.note_link)

    print("creating todoist task with content: %s and description: %s" %(content, description))
    try:
        todoist_task = api.add_task(
            content=content,
            description=description,
            priority=task.priority,
            labels=['actionify'],
            project_id=PROJECT_ID)
        return todoist_task.url
    except Exception as error:
        print(error)
        return None
