import {Atom} from "@affinity-lab/carbonite";

export default class SequenceDescriptor {
	constructor(readonly atom: typeof Atom, readonly property: string, readonly grouping: string | null = null) {}
	get table(): string {return this.atom.getRepository().metadata.tableName;}
}