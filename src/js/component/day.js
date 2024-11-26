import React, { useContext, useState, useEffect } from "react";
import PropTypes, { object } from "prop-types";
import { useDrop } from "react-dnd";
import { ContentPiece, SmartInput } from "./index.js";
import { ContentContext } from "../context.js";
import swal from "sweetalert";
import AsyncSelect from "react-select/async";
import { mappers } from "./utils";
import EditContentPiece from "./modals/EditContentPiece";
import api from "../api";

const icons = {
	lesson: "fas fa-book",
	replit: "fas fa-dumbbell",
	project: "fas fa-laptop-code",
	quiz: "fas fa-clipboard-check"
};
const Column = ({ heading, onDrop, pieces, type, onDelete, onEdit, onSwap }) => {
	const [editAsset, setEditAsset] = useState(null);
	const [{ isOver, canDrop }, drop] = useDrop({
		accept: type,
		drop: item => {
			onDrop(item);
		},
		collect: mon => ({
			isOver: !!mon.isOver(),
			canDrop: !!mon.canDrop()
		})
	});
	return (
		<div
			ref={drop}
			className="column rounded"
			style={{
				background: canDrop ? "#cce0d2" : isOver && !canDrop ? "red" : "white"
			}}>
			{editAsset && (
				<EditContentPiece
					defaultValue={editAsset}
					onSave={async _piece => {
						setEditAsset(null);
						onEdit(_piece);
						return _piece;
					}}
					onCancel={() => setEditAsset(null)}
				/>
			)}
			<button
				className="btn btn-sm btn-dark pointer float-right"
				style={{ padding: "0px 5px" }}
				onClick={() =>
					setEditAsset({
						custom: true,
						type,
						target: "blank",
						translations: {},
						technologies: []
					})
				}>
				<i className="fas fa-plus fa-xs" />
			</button>
			<h4 className="text-capitalize">
				<i className={icons[type] + " mr-1"}></i>
				{heading}
			</h4>
			<ul className="py-0 px-1">
				{pieces.length == 0 && <small className="p-0">No content</small>}
				{pieces
					.sort((a, b) => (a.position > b.position ? -1 : 1))
					.map((p, i, _pieces) => {
						return (
							<ContentPiece
								withSwap
								withMandatory
								key={i}
								type={p.type}
								data={p}
								status={p.status}
								isEditable={p.custom}
								onEdit={_piece => {
									setEditAsset(_piece);
								}}
								onUp={() => onSwap(p, _pieces[i - 1])}
								onDown={() => onSwap(p, _pieces[i + 1])}
								onDelete={() => onDelete(p)}
							/>
						);
					})}
			</ul>
		</div>
	);
};
Column.propTypes = {
	heading: PropTypes.string,
	type: PropTypes.string,
	pieces: PropTypes.array,
	technologies: PropTypes.array,
	translations: PropTypes.array,
	onDrop: PropTypes.func,
	onDelete: PropTypes.func,
	onEdit: PropTypes.func,
	onSwap: PropTypes.func
};
Column.defaultProps = {
	pieces: [],
	technologies: [],
	translations: [],
	type: null
};

const selectStyles = {
	container: (provided, state) => ({
		...provided,
		display: "inline-block",
		width: "200px"
	})
};

const Day = ({ data, onMoveUp, onMoveDown, onDelete, onEditInstructions }) => {
	const { store, actions } = useContext(ContentContext);
	const [_data, setData] = useState(data);
	const [addNewTech, setAddNewTech] = useState(false);
	const [concept, setConcept] = useState("");

	const handleDeleteLang = (language) => {
		swal({
			title: "Are you sure?!",
			text: `Do you want to eliminate language '${language}' from all modules?.`,
			icon: "warning",
			buttons: ["Cancel", "Eliminate"],
			dangerMode: true
		}).then((willDelete) => {
			if (willDelete) {
				actions.days().deleteLang(language);
				swal("Language successfully eliminated", {
					icon: "success"
				});
			} else {
				swal("Action canceled");
			}
		});
	};

	useEffect(() => {
		let updated = false;
		for (let key in data) {
			if (data[key] != _data[key]) updated = true;
		}
		if (updated) setData(data);
	}, [data]);

	return (
		<div className="day position-relative">
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
			<div className="d-flex justify-content-between" style={{ margin: '0 0 10px 1.5rem' }}>
				<p className="mb-0" style={{ textWrap: "nowrap", marginRight: "10px" }}>Module {_data.position}{"→"}{" "}</p>
				<div className="d-flex flex-wrap" style={{ flexGrow: "100", gap: "10px" }}>
					{typeof (_data.label) === "object" && Object.keys(_data.label).length > 0 ?
						Object.keys(_data.label).map((translation) => (
							<>
								<div key={translation} style={{ margin: "0 10px 0 0" }}>
									<span>{translation}: </span>
									<SmartInput
										title={translation}
										className={`border ${store?.syllabus_errors?.some(day => day.id === _data.id) && !_data.label[translation] ? "border-danger" : "border-secondary"}`}
										style={{ width: "auto" }}
										placeholder="Today's topic (very short)..."
										maxLength={35}
										onChange={(newValue) => {
											const updatedLabel = {
												..._data.label,
												[translation]: newValue
											};

											actions.days().update(_data.id, { ..._data, label: updatedLabel });
										}}
										initialValue={_data.label[translation]}
									/>
									<span onClick={() => handleDeleteLang(translation)}>
										<i className="fas fa-trash" />
									</span>
									{!_data.label[translation] && store?.syllabus_errors?.some(day => day.id === _data.id) &&
										<p className="text-danger text-center mb-0" style={{ fontSize: '12px' }}>
											Complete this field
										</p>
									}
								</div>
							</>

						))
						:
						<SmartInput
							className="transparent border border-secondary bg-white text-dark"
							style={{ width: "300px" }}
							placeholder="Today's topic (very short)..."
							maxLength={25}
							onChange={label => actions.days().update(_data.id, { ..._data, label })}
							initialValue={_data.label}
						/>
					}
					<div className="d-flex">
						<p className="m-0">module duration in days:</p>
						<SmartInput
							type="number"
							step="0.5"
							min="0.5"
							className="transparent border border-secondary bg-white text-dark"
							placeholder="Duration in days"
							maxLength={25}
							onChange={duration_in_days => {
								const numericValue = parseFloat(duration_in_days) || 1;
								actions.days().update(_data.id, { ..._data, duration_in_days: numericValue });
							}}
							initialValue={_data.duration_in_days}
						/>
					</div>
				</div>
				<div className="pointer float-right pe-2" onClick={() => onDelete(_data.id)}>
					<i className="fas fa-trash" />
				</div>
			</div>
			<div className="row no-gutters">
				<div className="col-6 pl-1">
					<SmartInput
						type="textarea"
						className="transparent w-100 bg-white-light rounded"
						placeholder="Type a description for the teacher..."
						onChange={teacher_instructions =>
							actions.days().update(_data.id, {
								..._data,
								teacher_instructions
							})
						}
						initialValue={_data.teacher_instructions || _data.instructions}
					/>
					<small className="text-right d-block" style={{ marginTop: "-8px" }}>
						<a
							href="#"
							onClick={e => {
								e.preventDefault();
								onEditInstructions(_data);
							}}>
							Ext. teacher instructions
						</a>
					</small>
				</div>
				<div className="col-6 pl-1">
					{typeof (_data.description) === "object" && Object.keys(_data.description).length > 0 ?
						Object.keys(_data.description).map((translation) => (
							<div key={translation} className="d-flex">
								<span className="font-weight-bold">{translation}: </span>
								<div className="w-100 d-flex flex-column">
									<SmartInput
										type="textarea"
										className={`transparent w-100 bg-white-light rounded border ${store?.syllabus_errors?.some(day => day.id === _data.id) && !_data.description[translation] ? "border-danger" : "border-secondary"}`}
										placeholder="Type a description for the students..."
										style={{ height: "100px" }}
										onChange={(newValue) => {
											const updatedDescription = {
												..._data.description,
												[translation]: newValue
											};

											actions.days().update(_data.id, { ..._data, description: updatedDescription });
										}}
										initialValue={_data.description[translation]}
									/>
									{!_data.description[translation] && store?.syllabus_errors?.some(day => day.id === _data.id) && (
										<p className="text-danger mb-0" style={{ fontSize: '12px' }}>Complete this field</p>
									)}
								</div>
							</div>
						))
						:
						<SmartInput
							type="textarea"
							className="transparent w-100 bg-white-light rounded"
							placeholder="Type a description for the students..."
							onChange={description => actions.days().update(_data.id, { ..._data, description })}
							initialValue={_data.description}
						/>
					}
				</div>
				<div className="col-12 mx-1 rounded">
					{_data["technologies"] !== undefined &&
						_data["technologies"].map((t, i) => {
							return (
								<span key={i} className="badge badge-dark mx-1">
									{t.title || t.label || t}{" "}
									<i
										onClick={() =>
											actions.days().update(_data.id, {
												..._data,
												["technologies"]: _data["technologies"].filter(tech => tech.slug != t.slug)
											})
										}
										className="fas fa-trash-alt pointer p-1"
									/>
								</span>
							);
						})}
					{addNewTech ? (
						<AsyncSelect
							loadOptions={async searchToken => {
								try {
									const technologies = await api.technology().filter({ like: searchToken });
									return technologies.map(tech => ({
										value: tech.slug,
										label: tech.title
									}));
								} catch (error) {
									console.error("Error fetching technologies:", error);
									return [];
								}
							}}
							styles={selectStyles}
							label="Add technologies"
							onChange={t => {
								actions.days().update(_data.id, {
									..._data,
									["technologies"]: _data["technologies"].concat([{ slug: t.value, title: t.label }])
								});
								setAddNewTech(false);
							}}
						/>
					) : (
						<button className="btn btn-sm btn-dark" style={{ fontSize: "10px" }} onClick={() => setAddNewTech(true)}>
							add technologies <i className="fas fa-plus fa-xs pointer p-1" />
						</button>
					)}
				</div>
				<div className="mx-1" style={{ margin: "3px 0px" }}>
					<p className="d-inline">
						<i className="fas fa-exclamation-triangle"></i> Key Concepts:{" "}
					</p>
					{_data["key-concepts"] !== undefined &&
						_data["key-concepts"].map((c, i) => {
							return (
								<span key={i} className="badge badge-dark mx-1">
									{c}{" "}
									<i
										onClick={() =>
											actions.days().update(_data.id, {
												..._data,
												["key-concepts"]: _data["key-concepts"].filter(kc => kc != c)
											})
										}
										className="fas fa-trash-alt pointer p-1"
									/>
								</span>
							);
						})}
					<input
						type="text"
						className="bg-white-light rounded border-0"
						placeholder={"Start typing and press enter"}
						value={concept}
						onChange={e => setConcept(e.target.value)}
						onKeyPress={e => {
							if (e.charCode == 13) {
								actions.days().update(_data.id, {
									..._data,
									["key-concepts"]: _data["key-concepts"].concat([concept])
								});
								setConcept("");
							}
						}}
					/>
				</div>
			</div>
			<div className="d-flex">
				{mappers
					.filter(m => m.draggable)
					.map((m, i) => (
						<Column
							key={i}
							heading={m.storeName}
							technologies={store.technologies}
							type={m.type}
							pieces={_data[m.storeName]}
							onEdit={item => {
								return actions
									.database()
									.add(item)
									.then(() => {
										actions.days().update(_data.id, {
											..._data,
											[m.storeName]: _data[m.storeName].filter(i => i.slug !== item.slug).concat(item)
										});
									});
							}}
							onSwap={(a, b) => {
								let fromPosition = a?.position;
								let toPosition = b?.position;
								if (a !== undefined && b !== undefined)
									actions.days().update(_data.id, {
										..._data,
										[m.storeName]: _data[m.storeName].map(i => {
											if (i.slug === a.slug) i.position = toPosition;
											else if (i.slug === b.slug) i.position = fromPosition;
											return i;
										})
									});
							}}
							onDrop={async item => {
								const exists = actions.days().findPiece(item, m.storeName);

								// by default we replace it (unless we found a copy on a different day; the user may want to duplicate it)
								let confirm =
									exists.found === false || exists.day.id === _data.id
										? "replace"
										: await swal({
											title: "Are you sure?",
											text: `This ${item.type} is already added to this syllabus on day ${exists.day.position}`,
											icon: "warning",
											buttons:
												item.type === "project"
													? {
														replace: "Move item",
														cancel: true
													}
													: {
														duplicate: "Copy item",
														replace: "Move item",
														cancel: true
													},
											dangerMode: true
										});

								// cancel action
								if (!confirm || confirm === undefined) return false;

								if (confirm === "replace" && exists.found) {
									actions.pieces().out(item.data, {
										id: exists.day.id,
										[m.storeName]: exists.day[m.storeName].filter(l => {
											console.log("item will be replaced", item, l);
											return typeof item.slug === "undefined" ? l.slug != item.data.slug : l.slug != item.slug;
										})
									});
								}

								// if the new column is empty this will be the first in possition
								if (item.position === undefined && _data[m.storeName].length === 0) item.data.position = 0;
								// the position of this new item should be the smallest in the list
								else if (item.position === undefined) {
									item.data.position = _data[m.storeName].sort((a, b) => (a.position > b.position ? 1 : -1))[0].position - 1;
								}

								actions.pieces().in(item, {
									id: _data.id,
									[m.storeName]: _data[m.storeName]
										.filter(l => {
											return typeof item.slug === "undefined" ? l.slug != item.data.slug : l.slug != item.slug;
										})
										.concat([item.data])
								});
							}}
							onDelete={item =>
								actions.pieces().out(item, {
									id: _data.id,
									[m.storeName]: _data[m.storeName].filter(l => {
										return typeof item.slug === "undefined" ? l.slug != item.data.slug : l.slug != item.slug;
									})
								})
							}
						/>
					))}
			</div>
			<div className="row no-gutters">
				<div className="col-12 px-1" style={{ marginTop: "3px" }}>
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
	onEditInstructions: PropTypes.func,
	onMoveDown: PropTypes.func,
	onDelete: PropTypes.func,
	data: PropTypes.object
};
export default Day;
