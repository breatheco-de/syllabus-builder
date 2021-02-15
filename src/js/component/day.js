import React, { useContext, useState, useEffect } from "react";
import PropTypes, { object } from "prop-types";
import { useDrop } from "react-dnd";
import { ContentPiece, SmartInput } from "./index.js";
import { ContentContext } from "../context.js";
import { ExtendedInstructions } from "./modal";
import swal from "sweetalert";

const Column = ({ heading, onDrop, pieces, type, onDelete }) => {
	const [{ isOver, canDrop }, drop] = useDrop({
		accept: type,
		drop: item => onDrop(item),
		collect: mon => ({
			isOver: !!mon.isOver(),
			canDrop: !!mon.canDrop()
		})
	});
	return (
		<div
			ref={drop}
			className="col-3"
			style={{
				background: canDrop ? "#cce0d2" : isOver && !canDrop ? "red" : "inherit"
			}}>
			<h4>{heading}</h4>
			<ul className="py-0 px-1">
				{pieces.length == 0 && <small className="p-0">No content</small>}
				{pieces.info !== undefined
					? pieces.map((p, i) => {
							return <ContentPiece key={i} type={p.type} status={p.status} data={p.info} onDelete={() => onDelete(p.info)} />;
					  })
					: pieces.map((p, i) => {
							return <ContentPiece key={i} type={p.type} data={p} status={p.status} onDelete={() => onDelete(p)} />;
					  })}
			</ul>
		</div>
	);
};
Column.propTypes = {
	heading: PropTypes.string,
	type: PropTypes.string,
	pieces: PropTypes.array,
	onDrop: PropTypes.func,
	onDelete: PropTypes.func
};
Column.defaultProps = {
	pieces: [],
	type: null
};

const Day = ({ data, onMoveUp, onMoveDown, onDelete }) => {
	const { store, actions } = useContext(ContentContext);
	const [_data, setData] = useState(data);
	const [editExtended, setEditExtended] = useState(false);
	const [concept, setConcept] = useState("");

	useEffect(
		() => {
			let updated = false;
			for (let key in data) {
				if (data[key] != _data[key]) updated = true;
			}
			if (updated) setData(data);
		},
		[data]
	);
	return (
		<div className="day bg-light position-relative">
			{_data.position > 1 && (
				<div className={"drag-up pointer"} onClick={() => onMoveUp()}>
					<i className="fas fa-chevron-up" />
				</div>
			)}
			{_data.position < store.days.length && (
				<div className={"drag-down pointer"} onClick={() => onMoveDown()}>
					<i className="fas fa-chevron-down" />
				</div>
			)}
			<h3>
				Day {_data.position}:{" "}
				<div className={"pointer float-right"} onClick={() => onDelete(_data.id)}>
					<i className="fas fa-trash" />
				</div>
				<SmartInput
					className="transparent"
					style={{ width: "300px" }}
					placeholder="Write the date label..."
					onChange={label => actions.days().update(_data.id, { ..._data, label })}
					initialValue={_data.label}
				/>
			</h3>
			{editExtended && (
				<ExtendedInstructions
					dayNumber={_data.position}
					defaultValue={_data.extended_instructions}
					onSave={extended_instructions => {
						actions.days().update(_data.id, { ..._data, extended_instructions });
						setEditExtended(false);
					}}
					onCancel={() => setEditExtended(false)}
				/>
			)}
			<div className="row no-gutters">
				<div className="col-6 pl-1">
					<SmartInput
						type="textarea"
						className="transparent w-100 bg-white-light rounded"
						placeholder="Add a description for the teacher..."
						onChange={teacher_instructions => actions.days().update(_data.id, { ..._data, teacher_instructions })}
						initialValue={_data.teacher_instructions || _data.instructions}
					/>
					<small className="text-right d-block">
						<a
							href="#"
							onClick={e => {
								e.preventDefault();
								setEditExtended(true);
							}}>
							Ext. teacher instructions
						</a>
					</small>
				</div>
				<div className="col-6 pl-1">
					<SmartInput
						type="textarea"
						className="transparent w-100 bg-white-light rounded"
						placeholder="Add a description for the students..."
						onChange={description => actions.days().update(_data.id, { ..._data, description })}
						initialValue={_data.description}
					/>
				</div>
				<div className="col-12 mx-1 bg-white-light rounded">
					{_data["key-concepts"] !== undefined &&
						_data["key-concepts"].map(c => {
							return (
								<span key={c} className="badge badge-dark mx-1">
									{c}{" "}
									<i
										onClick={() =>
											actions
												.days()
												.update(_data.id, { ..._data, ["key-concepts"]: _data["key-concepts"].filter(kc => kc != c) })
										}
										className="fas fa-trash-alt pointer p-1"
									/>
								</span>
							);
						})}
					<input
						type="text"
						placeholder={"Add a Key Concept"}
						className="transparent"
						value={concept}
						onChange={e => setConcept(e.target.value)}
						onKeyPress={e => {
							if (e.charCode == 13) {
								actions.days().update(_data.id, { ..._data, ["key-concepts"]: _data["key-concepts"].concat([concept]) });
								setConcept("");
							}
						}}
					/>
				</div>
			</div>
			<div className="row no-gutters">
				<Column
					heading="Lessons"
					type="lesson"
					pieces={_data.lessons}
					onDrop={async item => {
						const exists = actions.days().findPiece(item, "lessons");
						let confirm = true;
						if (exists) {
							confirm = await swal({
								title: "Are you sure?",
								text: `This ${item.type} is already added to this syllabus`,
								icon: "warning",
								buttons: true,
								dangerMode: true
							});
						}
						if (confirm)
							actions.pieces().in(item, {
								id: _data.id,
								lessons: _data.lessons
									.filter(l => (typeof item.slug === "undefined" ? l.slug != item.data.slug : l.slug != item.slug))
									.concat([item.data])
							});
					}}
					onDelete={item =>
						actions.pieces().out(item, {
							id: _data.id,
							lessons: _data.lessons.filter(l => (typeof item.slug === "undefined" ? l.slug != item.data.slug : l.slug != item.slug))
						})
					}
				/>
				<Column
					heading="Replits"
					type="replit"
					pieces={_data.replits}
					onDrop={async item => {
						const exists = actions.days().findPiece(item, "replits");
						let confirm = true;
						if (exists) {
							confirm = await swal({
								title: "Are you sure?",
								text: `This ${item.type} is already added to this syllabus`,
								icon: "warning",
								buttons: true,
								dangerMode: true
							});
						}
						if (confirm)
							actions.pieces().in(item, {
								id: _data.id,
								replits: _data.replits
									.filter(l => (typeof item.slug === "undefined" ? l.slug != item.data.slug : l.slug != item.slug))
									.concat([item.data])
							});
					}}
					onDelete={item =>
						actions.pieces().out(item, {
							id: _data.id,
							replits: _data.replits.filter(l => (typeof item.slug === "undefined" ? l.slug != item.data.slug : l.slug != item.slug))
						})
					}
				/>
				<Column
					heading="Projects"
					type="project"
					pieces={_data.assignments}
					onDrop={async item => {
						const exists = actions.days().findPiece(item, "assignments");
						let confirm = true;
						if (exists) {
							confirm = await swal({
								title: "Are you sure?",
								text: `This ${item.type} is already added to this syllabus`,
								icon: "warning",
								buttons: true,
								dangerMode: true
							});
						}
						if (confirm)
							actions.pieces().in(item, {
								id: _data.id,
								assignments: _data.assignments
									.filter(l => (typeof item.slug === "undefined" ? l.slug != item.data.slug : l.slug != item.slug))
									.concat([item.data])
							});
					}}
					onDelete={item =>
						actions.pieces().out(item, {
							id: _data.id,
							assignments: _data.assignments.filter(
								l => (typeof item.slug === "undefined" ? l.slug != item.data.slug : l.slug != item.slug)
							)
						})
					}
				/>
				<Column
					heading="Quizzes"
					type="quiz"
					pieces={_data.quizzes}
					onDrop={async item => {
						const exists = actions.days().findPiece(item, "quizzes");
						let confirm = true;
						if (exists) {
							confirm = await swal({
								title: "Are you sure?",
								text: `This ${item.type} is already added to this syllabus`,
								icon: "warning",
								buttons: true,
								dangerMode: true
							});
						}
						if (confirm)
							actions.pieces().in(item, {
								id: _data.id,
								quizzes: _data.quizzes
									.filter(l => {
										if (item.info == undefined) return false;
										if (typeof item.info.slug !== "undefined") return l.info.slug !== item.info.slug;
										return false;
									})
									.concat([item.data])
							});
					}}
					onDelete={item => {
						actions.pieces().out(item, {
							id: _data.id,
							quizzes: _data.quizzes.filter(l => {
								if (item.info == undefined) return false;
								if (typeof item.info.slug !== "undefined") return l.info.slug !== item.info.slug;
								return false;
							})
						});
					}}
				/>
			</div>
			<div className="row no-gutters">
				<div className="col-12 px-1">
					<SmartInput
						type="textarea"
						className="transparent w-100 bg-white-light rounded"
						placeholder="Any particular homework?"
						onChange={homework => actions.days().update(_data.id, { ..._data, homework })}
						initialValue={_data.homework}
					/>
				</div>
			</div>
		</div>
	);
};
Day.propTypes = {
	onDrop: PropTypes.func,
	onUpdate: PropTypes.func,
	onMoveUp: PropTypes.func,
	onMoveDown: PropTypes.func,
	onDelete: PropTypes.func,
	data: PropTypes.object
};
export default Day;
