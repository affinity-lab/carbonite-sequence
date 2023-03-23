import {DataSource, EntitySubscriberInterface, InsertEvent, RemoveEvent, UpdateEvent} from "typeorm";
import {Atom} from "@affinity-lab/carbonite";
import SequenceDescriptor from "./sequence-descriptor";

export default class Subscriber implements EntitySubscriberInterface<Atom> {
	constructor(readonly descriptor: SequenceDescriptor, readonly dataSource: DataSource) {}

	public listenTo() {return this.descriptor.atom}

	public async beforeInsert(event: InsertEvent<Atom>): Promise<any> {await this.handleLast(event.entity as Atom)}
	public async beforeUpdate(event: UpdateEvent<Atom>): Promise<any> {await this.handleLast(event.entity as Atom)}

	private async handleLast(item: Atom) {
		if (item[this.descriptor.property] === Infinity) {
			let where = {};
			if (this.descriptor.grouping !== null) where[this.descriptor.grouping] = item[this.descriptor.grouping];
			item[this.descriptor.property] = (await this.descriptor.atom.createQueryBuilder()
					.select(`Max(${this.descriptor.property}) AS MaxPos`)
					.where(where)
					.getRawOne()
			)['MaxPos'];
		}
	}

	public async afterRemove(event: RemoveEvent<Atom>): Promise<void> { await this.update(event.entity);}
	public async afterInsert(event: InsertEvent<Atom>): Promise<void> { await this.update(event.entity);}

	public async afterUpdate(event: UpdateEvent<Atom>) {
		let updatedProperties = new Set(event.updatedColumns.map(column => column.propertyName));
		if (updatedProperties.has(this.descriptor.property)) await this.update(event.entity as Atom)
	}
	private async update(item: Atom) {
		await this.shift(item);
		await this.reorder(item);
	}

	private async reorder(item: Atom) {
		// await this.dataSource.createQueryRunner().query(`SET @pos:=-1`);
		await this.dataSource.createQueryRunner().stream(
			`UPDATE ${this.descriptor.table} 
			SET ${this.descriptor.property} = (@pos := IF(@pos IS NULL, 0, @pos+1))
			${(this.descriptor.grouping !== null ? `WHERE ${this.descriptor.grouping} <=> ? ` : '')}
			ORDER BY ${this.descriptor.property}`,
			[
				item[this.descriptor.grouping]
			]);
	}

	private async shift(item: Atom) {
		await this.dataSource.createQueryRunner().stream(`UPDATE ${this.descriptor.table} 
			SET ${this.descriptor.property} = ${this.descriptor.property} + 1
			WHERE ${this.descriptor.property} >= ?
			AND id != ?
			${(this.descriptor.grouping !== null ? `AND ${this.descriptor.grouping} <=> ? ` : '')}
			ORDER BY ${this.descriptor.property}`,
			[
				item[this.descriptor.property],
				item.id,
				item[this.descriptor.grouping]
			])
	}
}
