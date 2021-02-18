//import react into the bundle
import React, { useContext, useState } from "react";
import ReactDOM from "react-dom";
import "bootstrap";
import "jquery";
import "../styles/index.scss";
import { Day, ContentWidget, UploadSyllabus, SyllabusDetails, Sidebar } from "./component";
import { ContentContext, injectContent } from "./context.js";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import { Notifier, Notify } from "bc-react-notifier";
import swal from "sweetalert";
import { useEffect } from "react";

//include your index.scss file into the bundle

const params = new URLSearchParams(window.location.search);
const API_KEY = params.get("token");

const Main = injectContent(() => {
	const { store, actions } = useContext(ContentContext);
	const [state, setState] = useState(false);
	const sortedDays = store.days.sort((a, b) => (a.position < b.position ? -1 : 1));
	const confirmSaveSillabus = async () => {
		if (store.info.slug !== "" && store.days.length > 0) {
			const willSave = await swal({
				title: "Are you sure?",
				text: `Creating a NEW syllabus version for ${store.info.slug} academy ${store.info.academy_author}?`,
				icon: "warning",
				buttons: true,
				dangerMode: true
			});
			if (willSave) {
				try {
					//                              ⬇ true means new version number
					const data = await actions.saveSyllabus(true);
					actions.setInfo({ version: data.version });
					swal(`New syllabus ${data.json.slug} v${data.version} saved successfully`, {
						icon: "success"
					});
				} catch (error) {
					console.error("Error: ", error);
					swal(error.message || error, {
						icon: "error"
					});
				}
			} else {
				swal("Operation canceled by user");
			}
		} else if (store.info.slug === "") {
			swal({
				title: "Syllabus details can't be empty",
				text: "Please fill the syllabus details to save",
				icon: "error",
				button: "OK"
			});
		} else if (store.days.length === 0) {
			swal({
				title: "Syllabus without days",
				text: "A new syllabus version can't be saved without days, please add new days to the syllabus",
				icon: "error",
				button: "OK"
			});
		}
	};
	const confirmEditSillabus = async () => {
		if (store.info.slug !== "" && store.days.length > 0) {
			const willEdit = await swal({
				title: "Are you sure?",
				text: "Update a PREVIOUS version " + store.info.version,
				icon: "warning",
				buttons: true,
				dangerMode: true
			});
			if (willEdit) {
				try {
					//                                      ↓ false means saving under the same version
					const data = await actions.saveSyllabus(false);
					swal("Syllabus version " + store.info.version + " update successfully", {
						icon: "success"
					});
				} catch (error) {
					console.error("Error updating syllabus: ", error);
					swal(error.message || error.msg || error, {
						icon: "error"
					});
				}
			} else {
				swal("Operation canceled by user");
			}
		} else if (store.info.slug === "") {
			swal({
				title: "Syllabus details can't be empty",
				text: "Please fill the syllabus details to save",
				icon: "error",
				button: "OK"
			});
		} else if (store.days.length === 0) {
			swal({
				title: "Syllabus without days",
				text: "A new syllabus version can't be saved without days, please add new days to the syllabus",
				icon: "error",
				button: "OK"
			});
		}
	};

	useEffect(() => {
		actions.getMe();

		window.onbeforeunload = function() {
			return "Are you sure you want to exit?";
		};
	}, []);

	if (!API_KEY)
		return (
			<div>
				Click here to <a href={`https://breathecode.herokuapp.com/v1/auth/view/login?url=${window.location.href}`}>log in</a>
			</div>
		);

	return (
		<>
			<DndProvider backend={Backend}>
				<div className="row no-gutters">
					<Sidebar content={store} onRefresh={type => actions.fetch([type], true)} />
					<div className="right-side offset-4 offset-md-3 col-8 col-md-9 p-3 pt-0">
						<Notifier />
						<div className="text-right p-3 position-sticky sticky-top bg-light" style={{ margin: "-15px" }}>
							<button className="btn btn-dark btn-sm mr-2" onClick={() => actions.days().add()}>
								<i className="fas fa-plus" /> Add new day
							</button>
							{store.days.length > 0 && (
								<>
									{store.info.label &&
										store.info.label != "" && (
											<div className="float-left">
												{store.info.label}: {store.info.slug}
											</div>
										)}
									<button className="btn btn-danger btn-sm mr-2" onClick={() => actions.clear()}>
										<i className="fas fa-ban" /> Clear
									</button>
									{store.info.version != "" &&
										store.info.version && (
											<button className="btn btn-primary btn-sm mr-2" onClick={() => confirmEditSillabus()}>
												<i className="fas fa-save" /> Save
											</button>
										)}
									<button className="btn btn-primary btn-sm mr-2" onClick={() => confirmSaveSillabus()}>
										<i className="fas fa-save" /> Save as new...
									</button>
									<button className="btn btn-dark btn-sm mr-2" onClick={() => actions.download()}>
										<i className="fas fa-file-download" /> Export
									</button>
								</>
							)}

							<button
								className="btn btn-dark btn-sm mr-2"
								onClick={() => {
									let noti = Notify.add(
										"info",
										UploadSyllabus,
										answer => {
											if (answer.value) actions.upload(answer.url);
											noti.remove();
										},
										9999999999999
									);
								}}>
								<i className="fas fa-file-upload" /> Import
							</button>
							<button
								className="btn btn-dark btn-sm"
								onClick={() => {
									let noti = Notify.add(
										"info",
										SyllabusDetails,
										answer => {
											if (answer.value) actions.setInfo(answer.data);
											noti.remove();
										},
										9999999999999
									);
								}}>
								<i className="fas fa-bars" /> Load
							</button>
						</div>
						<div className="hbar" />
						{sortedDays.map((d, i) => (
							<div key={d.id.toString() + d.position.toString()}>
								<Day
									key={d.id.toString() + d.position.toString()}
									data={d}
									onMoveUp={() => {
										const other = store.days.find(_day => _day.position === d.position - 1);
										actions.days().update(d.id, { ...d, position: d.position - 1 });
										actions.days().update(other.id, { ...other, position: other.position + 1 });
									}}
									onMoveDown={() => {
										const other = store.days.find(_day => _day.position === d.position + 1);
										actions.days().update(d.id, { ...d, position: d.position + 1 });
										actions.days().update(other.id, { ...other, position: other.position - 1 });
									}}
									onDelete={id => {
										actions.days().delete(id);
									}}
								/>
								<div className="text-center">
									<i onClick={() => actions.days().add(i + 1)} className="fas fa-plus-circle pointer text-secondary" />
								</div>
							</div>
						))}
					</div>
				</div>
			</DndProvider>
		</>
	);
});

//render your react application
ReactDOM.render(<Main />, document.querySelector("#app"));
