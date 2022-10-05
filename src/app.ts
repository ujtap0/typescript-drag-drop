enum ProjectStatus {Active, Finished}

class Project {
  constructor(
    public id:string, 
    public title: string, 
    public description: string, 
    public people: number, 
    public status: ProjectStatus) {}
}
type Listner = (items: Project[]) => void;

// Project State Management
// Singleton class
class ProjectState{
  private listners: Listner[] = [];
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor(){

  }
  static getInstacne() {
    if(this.instance){
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance
  }

  // a list of functions in the end, which should be called whenever something changes
  addListner(listnerFn: Listner){
    this.listners.push(listnerFn);
  }

  addProject(title: string, description: string, numOfPeople: number){
    const newProject = new Project(Math.random.toString(), title, description, numOfPeople, ProjectStatus.Active)
    this.projects.push(newProject);

    for(const listnerFn of this.listners){
      listnerFn(this.projects.slice());
    }
  }
}

// it will always only have one object of the type in the entire application
// work with the exact same obejct => 한개의 상태 관리 obj를 보장
const projectState = ProjectState.getInstacne();

interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number
}

function validate(validatableInput : Validatable){
  let isValid = true;
  if(validatableInput.required){
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if(validatableInput.minLength != null && 
    typeof validatableInput.value === 'string'
    ){
    isValid = isValid && validatableInput.value.length > validatableInput.minLength;
  }
  if(validatableInput.maxLength != null && 
    typeof validatableInput.value === 'string'
    ){
    isValid = isValid && validatableInput.value.length < validatableInput.maxLength;
  }
  if(validatableInput.min != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value > validatableInput.min
  }
  if(validatableInput.max != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value < validatableInput.max
  }
  return isValid
}

//ProjectList Class
class ProjectList {
  templateElement!: HTMLTemplateElement;
  hostElement!: HTMLDivElement;
  element: HTMLElement;
  assignedProjects: Project[];

  constructor(private type: 'active' | 'finished'){
    const templateEl = document.getElementById('project-list');
    const hostEl = document.getElementById('app');
    if(templateEl) this.templateElement = templateEl as HTMLTemplateElement;
    if(hostEl) this.hostElement = hostEl as HTMLDivElement;

    this.assignedProjects = [];

    const importedNode = document.importNode(this.templateElement.content, true);
    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${this.type}-projects`;

    // register a listner function
    // addListner로 pass해준 function은 새로운 proejcts가 추가될 때 호출 된다. 
    projectState.addListner((projects: Project[])=>{
      const relevatnProjects = projects.filter(prj => {
        if(this.type = 'active'){
          return prj.status === ProjectStatus.Active
        }
        return prj.status === ProjectStatus.Finished
      });
      // this function will get alist of projects when it's called from ProjectState
      this.assignedProjects = relevatnProjects;
      this.renderProjects();
    });

    this.attach()
    this.renderContent();
  }

  private renderProjects(){
    const listEl = document.getElementById( `${this.type}-projects-list`)! as HTMLUListElement;
    for(const prjItem of this.assignedProjects){
      const listItem = document.createElement('li');
      listItem.textContent = prjItem.title;
      listEl.appendChild(listItem)
    }
  }

  private renderContent(){
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + 'PROJECTS';
  }

  private attach() {
    this.hostElement.insertAdjacentElement('beforeend', this.element);
  }
}

//ProjectInput Class
class ProjectInput {
  templateElement!: HTMLTemplateElement;
  hostElement!: HTMLDivElement;
  element: HTMLFormElement;
  titleInputElement : HTMLInputElement;
  descriptionInputElement : HTMLInputElement;
  peopleInputElement : HTMLInputElement;

  constructor(){
    const templateEl = document.getElementById('project-input');
    const hostEl = document.getElementById('app');
    if(templateEl) this.templateElement = templateEl as HTMLTemplateElement;
    if(hostEl) this.hostElement = hostEl as HTMLDivElement

    const importedNode = document.importNode(this.templateElement.content, true);
    this.element = importedNode.firstElementChild as HTMLFormElement;
    this.element.id = 'user-input';

    this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

    this.configure();
    this.attach();
  }
  private gatherUserInput(): [string, string, number] | void{
    const enteredTitle = this.titleInputElement.value;
    const enteredDesciption = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value : enteredTitle,
      required: true
    }
    const descriptionValidatable: Validatable = {
      value : enteredDesciption,
      required: true,
      minLength: 5
    }
    const peopleValidatable: Validatable = {
      value : enteredPeople,
      required: true,
      min: 1
    }

    if(
      !validate(titleValidatable) &&
      !validate(descriptionValidatable) &&
      !validate(peopleValidatable) 
    ){
      alert('잘못된 입력값입니다')
      return;
    } else {
      return [enteredTitle, enteredDesciption, +enteredPeople]
    }
  }

  private clearInput() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }

  private submitHandler (event: Event){
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if(Array.isArray(userInput)){
      const [title, desc, people] = userInput;
      projectState.addProject(title, desc, people);
      this.clearInput();
    }
  }

  private configure(){
    this.element.addEventListener('submit', this.submitHandler.bind(this))
  }

  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin', this.element);
  }
}

const prjInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished');

