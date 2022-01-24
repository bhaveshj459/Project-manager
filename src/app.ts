enum ProjectStatus{Active,Finished}

// drage drop threalted work
interface Dragable{
  dragStartEvent(event:DragEvent):void;
  dragEndEvent(event:DragEvent):void;
}

interface DragTarget{
  dragOverHandler(event:DragEvent):void;
  dropHandler(event:DragEvent):void;
  dragLeaveHandler(event:DragEvent):void;
}

//project class
class Project{
    constructor(
        public id:string,
        public title:string,
        public description:string,
        public people:number,
        public status:ProjectStatus
    ){}

    
}

type Listener <T>=(items:T[])=>void;
//state
class State<T>{
  protected listeners: Listener<T>[] = [];
  addlisteners(listenerFn:Listener<T>){
    this.listeners.push(listenerFn);
}
} 

//project manager
class ProjectState extends State<Project>{
    
    private project:Project[]=[];
    private static instance: ProjectState;

    private constructor() {
      super()
    }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
  }
  


    addProject(title:string,desc:string, people:number){
        let newProject=new Project(Math.random().toString(),title,desc,people,ProjectStatus.Active) 
        this.project.push(newProject);
        this.updateListeners();
    }

    moveProject(projId:string,projStatus:ProjectStatus){
      const projects=this.project.find((proj)=>proj.id===projId)
      if(projects&&projects.status!==projStatus){
        projects.status=projStatus
        this.updateListeners();
      }
    }

    updateListeners(){
      for(const listeners of this.listeners){
        listeners(this.project.slice())
    }
    }

}
const projectState = ProjectState.getInstance();


interface Validatable{
    value:string|number;
    require?:boolean;
    maxlength?:number;
    minlength?:number;
    max?:number;
    min?:number;
}

function validate(input:Validatable){
    let isValid = true;
  if (input.require) {
    isValid = isValid && input.value.toString().trim().length !== 0;
  }
  if (
    input.minlength != null &&
    typeof input.value === 'string'
  ) {
    isValid =
      isValid && input.value.length >= input.minlength;
  }
  if (
    input.maxlength != null &&
    typeof input.value === 'string'
  ) {
    isValid =
      isValid && input.value.length <= input.maxlength;
  }
  if (
    input.min != null &&
    typeof input.value === 'number'
  ) {
    isValid = isValid && input.value >= input.min;
  }
  if (
    input.max != null &&
    typeof input.value === 'number'
  ) {
    isValid = isValid && input.value <= input.max;
  }
  return isValid;



    // let isValide=true;
    // if(input.require){
    //     isValide=isValide && input.value.toString().trim().length!==0
    // }
    
    // if(input.maxlength !=null && typeof input.value==="string"){
    //     isValide=isValide&& input.value.length< input.maxlength;
    // }
    // if(input.minlength!=null && typeof input.value==="string"){
    //     isValide=isValide&& input.value.length > input.minlength;
    // }
    
    // if(typeof input.value==="number"){
    //     if(input.max!=null){
    //         isValide=isValide&& input.value< input.max;
    //     }
    //     if(input.min!=null){
    //         isValide=isValide&& input.value< input.min;
    //     }
    // }

    // return isValide;
}


function Autobind(_:any,_2:string,discriptor:PropertyDescriptor){
    const originalMethod=discriptor.value;
    const adjdiscriptor:PropertyDescriptor={
        configurable:true,
        enumerable:false,
        get(){
            const boundfn=originalMethod.bind(this);
            return boundfn;
        }
    }
    return adjdiscriptor
}

//component base class
abstract class Component<T extends HTMLElement,U extends HTMLElement>{
  hostEle:T;
  templEle:HTMLTemplateElement;
  element:U;

  constructor(
    tempId:string,
    hostId:string,
    insertAtBeginning:boolean,
    newEleId?:string
    
  ){
    this.hostEle=document.getElementById(hostId) as T;
    this.templEle=document.getElementById(tempId)! as HTMLTemplateElement;
    const importedNode = document.importNode(this.templEle.content,true);
       
     this.element = importedNode.firstElementChild as U;
     if(newEleId){
      this.element.id = newEleId;
     }

     this.attachToDOM(insertAtBeginning)
  }

  attachToDOM(insertAtBeginning:boolean){
    this.hostEle.insertAdjacentElement( insertAtBeginning ?'afterbegin':'beforeend'
    , this.element);
  }
  abstract configure():void;
  abstract renderContent():void;

}

//project Item class
class ProjectItem extends Component<HTMLUListElement,HTMLLIElement>
 implements Dragable {
  project:Project;
  constructor(hostId:string,project:Project){
    super("single-project",hostId,false,project.id)
    this.project=project;

    this.configure();
    this.renderContent();
  }
  @Autobind
  dragStartEvent(event: DragEvent): void {
      //console.log(event);
      event.dataTransfer!.setData("text/plain",this.project.id);
      event.dataTransfer!.effectAllowed='move';
  }
  dragEndEvent(_event: DragEvent): void {
    console.log("End");
  }


  renderContent(): void {
    this.element.querySelector("h2")!.textContent=`Title:-${this.project.title}`;
    this.element.querySelector("p")!.textContent=`Description:-${this.project.description}`;
    this.element.querySelector("h3")!.textContent=`No Of People:-${this.project.people}`
      
  }
  configure(): void {
      this.element.addEventListener("dragstart",this.dragStartEvent);
      this.element.addEventListener("dragend",this.dragEndEvent);
      
  }
  
}
 

//ul list related work
class ProjectList extends Component<HTMLDivElement,HTMLElement> 
implements DragTarget{

    
    assignedProj:Project[];

    constructor(private type:'active'|'finished'){
      super("project-list",'app',false,`${type}-projects`)
       
        this.assignedProj=[];
        
        
        this.configure();
        this.renderContent();
    }
    private renderProjects(){
        const listId=document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        listId.textContent='';

        //RENDERING ITEMS   
        for(const projitem of this.assignedProj){
            
            new ProjectItem(`${this.type}-projects-list`,projitem);
            // const listItem=document.createElement('li');
            // listItem.textContent=projitem.title;
            // listId.appendChild(listItem);
        }
    }
    @Autobind
    dragOverHandler(event:DragEvent): void {
      if(event.dataTransfer && event.dataTransfer.types[0]==='text/plain'){
        event.preventDefault();
        const eleli= this.element.querySelector("ul")!;
        eleli.classList.add('droppable');
      }
       
    }
    @Autobind
    dragLeaveHandler(_event:DragEvent): void {
      const eleli= this.element.querySelector("ul")!;
      eleli.classList.remove('droppable');
    }
    @Autobind
    dropHandler(event:DragEvent): void {
      const projid=event.dataTransfer!.getData('text/plain');
      projectState.moveProject(
        projid,
        this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished
        );
    }

    configure(): void {
      projectState.addlisteners((projects:Project[])=>{
        let relaventProj=projects.filter(proj=>{
           if(this.type==='active')
             return proj.status===ProjectStatus.Active
            else
            return proj.status===ProjectStatus.Finished
        } )
        this.assignedProj=relaventProj;
        this.element.addEventListener("dragover",this.dragOverHandler);
        this.element.addEventListener("dragleave",this.dragLeaveHandler);
         this.element.addEventListener("drop",this.dropHandler);
        this.renderProjects();
    });
    }

     renderContent(){
        const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent =
      this.type.toUpperCase() + ' PROJECTS';
        
    }


  



}







// form related work
class ProjectInput extends Component<HTMLDivElement,HTMLFormElement>{
    
    titleInpEle:HTMLInputElement;
    discriptionInpEle:HTMLInputElement;
    peopleInpEle:HTMLInputElement;
    

    constructor(){
      super("project-input",`app`,true,"user-input")
        
        this.titleInpEle=this.element.querySelector("#title") as HTMLInputElement;
        this.discriptionInpEle=this.element.querySelector("#description") as HTMLInputElement;
        this.peopleInpEle=this.element.querySelector("#people") as HTMLInputElement;

        

        this.configure();
        
    }
    valInp():[string,string,number]|void {
        const title:string=this.titleInpEle.value;
        const description:string=this.discriptionInpEle.value;
        const people:number=+this.peopleInpEle.value;

        const titleValatable: Validatable = {
            value: title,
            require: true
          };
          const disciptionValatable: Validatable = {
            value: description,
            require: true,
            minlength: 5
          };
          const peopleValatable: Validatable = {
            value: people,
            require: true,
            min: 1,
            max: 5
          };
        if(
            !validate(titleValatable)||
            !validate(disciptionValatable)||
            !validate(peopleValatable)
        ){
            alert("invalid Input");
        }
        else
        return[title,description,people]
        
        
    }

    clearFields(){
       this.titleInpEle.value='';
       this.discriptionInpEle.value=''; 
       this.peopleInpEle.value=''; 
    }

    @Autobind
    addData(event:Event){
     event.preventDefault();
     console.log(this.titleInpEle.value)
     const userInp=this.valInp();
     if(Array.isArray(userInp)){
         const[title,desc,people]=userInp;
         projectState.addProject(title, desc, people);
         this.clearFields();
     }

    }
    
    configure(){
        this.element.addEventListener('submit',this.addData)
    }
    renderContent(): void {
        
    }

}


 const project=new ProjectInput;
  const activeProject=new ProjectList('active');
 const finishedProject=new ProjectList("finished");
