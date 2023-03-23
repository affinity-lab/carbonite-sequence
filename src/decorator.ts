import {Atom} from "@affinity-lab/carbonite";
import sequenceModuleManager from "./module-manager";
import SequenceDescriptor from "./sequence-descriptor";

export default function Sequence(grouping: string | null = null) {
	return function (target: Object, propertyKey: string) {
		sequenceModuleManager.addDescriptor(new SequenceDescriptor(target.constructor as typeof Atom, propertyKey, grouping));
	}
}