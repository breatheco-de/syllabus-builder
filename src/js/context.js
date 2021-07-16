import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import API from "./api.js";
import { urls } from "./component/utils";
import { ToastProvider } from "react-toast-notifications";

export const ContentContext = React.createContext({});

const newDay = (id = 0, position = 0, seed = {}) => ({
	label: "",
	"key-concepts": [],
	lessons: [],
	projects: [],
	replits: [],
	quizzes: [],
	technologies: [],
	...seed,
	id,
	position
});

API.setOptions({
	assetsPath:
		//"https://8080-f0d8e861-4b22-40c7-8de2-e2406c72dbc6.ws-us02.gitpod.io/apis",
		"https://assets.breatheco.de/apis",
	apiPath: "https://api.breatheco.de",
	apiPathV2: process.env.API_URL + "/v1"
	// apiPathV2: "https://8000-b748e395-8aa2-4f7e-bfc5-0b7234f4f182.ws-us03.gitpod.io/v1"
});
const mapEntity = {
	lesson: "lessons",
	project: "projects",
	technology: "technologies",
	replit: "replits",
	quiz: "quizzes",
	profile: "profiles",
	syllabu: "syllabus",
	courseV2: "courses"
};
const defaultSyllabusInfo = {
	label: "",
	slug: "",
	version: "",
	profile: null,
	description: "",
	academy_author: null
};
const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			days: [],
			info: defaultSyllabusInfo,
			profiles: [],
			lessons: [],
			projects: [],
			replits: [],
			quizzes: [],
			syllabus: [],
			courses: [],
			academies: [],
			technologies: [],
			report: [],
			imported_days: [],
			imported_syllabus: []
		},

		actions: {
			setStore: _store => setStore(_store),
			getStore: () => getStore(),
			getMe: async () => {
				const data = await API.getMe();
				setStore({
					academies: data.roles.map(r => r.academy)
				});
			},
			fetch: (models, forceUpdate = false) => {
				if (!Array.isArray(models)) models = [models];
				return models.map(
					entity =>
						new Promise((resolve, reject) => {
							if (forceUpdate || !Array.isArray(mapEntity[entity] || mapEntity[entity].length == 0))
								API[entity]()
									.all()
									.then(_data => {
										let data = _data.data || _data;
										if (!Array.isArray(data)) data = Object.values(data);
										const newStore = {
											[mapEntity[entity]]: data
												.filter(e => {
													return (
														typeof e.lang === "undefined" ||
														e.lang == "us" ||
														e.lang == "en" ||
														["project", "replit", "exercise"].includes(entity)
													);
												})
												.map(e => {
													e.type = entity;
													return e;
												})
										};
										setStore(newStore);
										resolve(data);
									})
									.catch(error => reject(error));
						})
				);
			},
			report: () => {
				return {
					add: (type, message, item) => {
						const store = getStore();
						setStore({ report: store.report.concat({ type, message, item }) });
					},
					clear: () => {
						setStore({ report: [] });
					}
				};
			},
			import: data => {
				const actions = getActions();
				const { projects } = getStore();
				let content = JSON.parse(data.content);
				let json = typeof content.json === "string" ? (json = JSON.parse(content.json)) : content.json;

				let { days, weeks } = json || content;
				if (Array.isArray(weeks) && !Array.isArray(days))
					days = [].concat.apply(
						[],
						weeks.map(w => w.days)
					);
				setStore({
					imported_days: days.map((d, i) => {
						return {
							...d,
							id: i + 1,
							position: i + 1,
							technologies: d.technologies || [],
							lessons:
								d.lessons !== undefined
									? d.lessons.map(l => {
											l.type = "lesson";
											return l;
									  })
									: (d.lessons = []),
							replits:
								d.replits !== undefined
									? d.replits.map(l => {
											l.type = "replit";
											return l;
									  })
									: (d.replits = []),
							//from the json it comes like an assignment, but its really a project
							projects:
								d.assignments !== undefined
									? d.assignments.map(p => {
											const project = projects.find(_pro => (p.slug !== undefined ? _pro.slug === p.slug : _pro.slug === p));
											if (project === undefined) {
												if (typeof p === "object") {
													actions.report().add("warning", `Project not found ${p.slug || p} on position ${i + 1}`, p);
													return { ...p, type: "project" };
												} else {
													actions.report().add("error", `Invalid project ${p} on position ${i + 1}`, p);
													return { type: "project", slug: p, title: "Invalid project" };
												}
											}

											return project;
									  })
									: (d.assignments = []),
							quizzes:
								d.quizzes !== undefined
									? d.quizzes
											.filter(f => f.slug != undefined)
											.map(l => {
												l.type = "quiz";
												return l;
											})
									: (d.quizzes = [])
						};
					})
				});
			},
			upload: (data, overrideInfo = {}) => {
				//if its not a url
				const actions = getActions();
				const { projects, info } = { ...getStore(), info: overrideInfo };

				if (typeof data.content === "string" && !data.content.startsWith("http")) {
					let content = JSON.parse(data.content);
					let json = typeof content.json === "string" ? (json = JSON.parse(content.json)) : content.json;
					actions.report().clear(); //clear noticications

					let { days, label, description, weeks } = json || content;
					if (Array.isArray(weeks) && !Array.isArray(days))
						days = [].concat.apply(
							[],
							weeks.map(w => w.days)
						);
					setStore({
						days: days.map((d, i) => {
							return {
								...d,
								id: i + 1,
								position: i + 1,
								technologies: d.technologies || [],
								lessons:
									d.lessons !== undefined
										? d.lessons.map(l => {
												l.type = "lesson";
												return l;
										  })
										: (d.lessons = []),
								replits:
									d.replits !== undefined
										? d.replits.map(l => {
												l.type = "replit";
												return l;
										  })
										: (d.replits = []),
								//from the json it comes like an assignment, but its really a project
								projects:
									d.assignments !== undefined
										? d.assignments.map(p => {
												const project = projects.find(_pro =>
													p.slug !== undefined ? _pro.slug === p.slug : _pro.slug === p
												);
												if (project === undefined) {
													if (typeof p === "object") {
														actions.report().add("warning", `Project not found ${p.slug || p} on position ${i + 1}`, p);
														return { ...p, type: "project" };
													} else {
														actions.report().add("error", `Invalid project ${p} on position ${i + 1}`, p);
														return { type: "project", slug: p, title: "Invalid project" };
													}
												}

												return project;
										  })
										: (d.assignments = []),
								quizzes:
									d.quizzes !== undefined
										? d.quizzes
												.filter(f => f.slug != undefined)
												.map(l => {
													l.type = "quiz";
													return l;
												})
										: (d.quizzes = [])
							};
						})
					});
					actions.setInfo({ slug: info.profile, profile: info.profile, label, description, version: info.version });
				} else
					new Promise((resolve, reject) => {
						return fetch(data)
							.then(resp => {
								if (resp.ok) {
									return resp.json();
								} else throw new Error("There was an error code " + resp.status);
							})
							.then(json => {
								let { days, label, description, weeks } = json;
								if (weeks)
									days = weeks
										.map(w => w.days)
										.flat()
										.filter(d => d.label !== "Weekend")
										.map((d, i) => ({
											...d,
											id: i + 1,
											position: i + 1,
											technologies: d.technologies || [],
											lessons: d.lessons ? d.lessons.map(l => ({ ...l, type: "lesson" })) : [],
											replits: d.replits ? d.replits.map(l => ({ ...l, type: "replit" })) : [],
											projects: d.assignments
												? d.assignments.map(a => ({ ...projects.find(p => p.slug === a), type: "project" }))
												: [],
											quizzes: d.quizzes ? d.quizzes.map(l => ({ ...l, type: "quiz" })) : [],
											"key-concepts": d["key-concepts"] || []
										}));
								setStore({ days });

								actions.setInfo({ slug: info.profile, profile: info.profile, label, description, version: info.version });
								resolve(json);
							})
							.catch(error => reject(error));
					});
			},
			setInfo: data => {
				const store = getStore();
				setStore({ info: { ...store.info, ...data } });
				window.location.hash = data.slug;
			},
			serialize: newVersion => {
				const store = getStore();
				let payload = {
					...store.info,
					days: store.days.map(d => ({
						...d,
						projects: undefined,
						project:
							d.projects.length == 0
								? undefined
								: {
										title: d.projects[0].title,
										instructions: `${urls.project}${d.projects[0].slug}`
								  },
						assignments: d.projects.map(p => ({
							slug: p.slug,
							title: p.title,
							target: p.target,
							url: p.url,
							mandatory: p.mandatory
						})),
						replits: d.replits.map(e => ({
							title: e.info != undefined ? e.info.title : e.title,
							slug: e.info != undefined ? e.info.slug : e.slug,
							target: e.info != undefined ? e.info.target : e.target,
							url: e.info != undefined ? e.info.url : e.url,
							mandatory: e.info != undefined ? e.info.mandatory : e.mandatory
						})),
						quizzes: d.quizzes.map(e => ({
							title: e.info != undefined ? e.info.name : e.title,
							target: e.info != undefined ? e.info.target : e.target,
							slug: e.info != undefined ? e.info.slug : e.slug,
							url: e.info != undefined ? e.info.url : e.url,
							mandatory: e.info != undefined ? e.info.mandatory : e.mandatory
						})),
						lessons: d.lessons.map(e => ({
							title: e.title,
							slug: e.slug.substr(e.slug.indexOf("]") + 1), //remove status like [draft]
							target: e.info != undefined ? e.info.target : e.target,
							url: e.info != undefined ? e.info.url : e.url,
							mandatory: e.info != undefined ? e.info.mandatory : e.mandatory
						}))
					}))
				};
				payload = { json: payload };
				if (newVersion) payload.slug = undefined;
				return payload;
			},
			download: () => {
				const actions = getActions();
				const store = getStore();
				var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(actions.serialize().json, null, "   "));
				var dlAnchorElem = document.getElementById("downloadAnchorElem");
				dlAnchorElem.setAttribute("href", dataStr);
				dlAnchorElem.setAttribute("download", store.info.slug ? store.info.slug + ".v" + store.info.version + ".json" : "syllabus.json");
				dlAnchorElem.click();
			},
			saveSyllabus: async (newVersion = false) => {
				const store = getStore();
				const actions = getActions();
				if (!newVersion && store.info.version == "null") throw Error("Please pick a syllabus version");
				else if (store.info.version === "new") newVersion = true;
				const url = newVersion
					? API.options.apiPathV2 + "/admissions/certificate/" + store.info.profile + "/academy/" + store.info.academy_author + "/syllabus"
					: API.options.apiPathV2 +
					  "/admissions/certificate/" +
					  store.info.profile +
					  "/academy/" +
					  store.info.academy_author +
					  "/syllabus/" +
					  store.info.version;
				const params = new URLSearchParams(window.location.search);
				const apiKey = params.get("token");
				const resp = await fetch(url, {
					method: newVersion ? "POST" : "PUT",
					body: JSON.stringify(actions.serialize(newVersion), null, "   "),
					headers: {
						"Content-type": "application/json",
						Authorization: "Token " + apiKey,
						Academy: parseInt(store.info.academy_author)
					}
				});
				if (resp.status < 200 || resp.status > 299) {
					if (resp.status > 399 && resp.status < 500) {
						const data = await resp.json();
						if (typeof data === "object") {
							if (data.detail || data.details) throw Error(data.detail || data.details);
							for (let atr in data) {
								throw Error(`Field "${atr}": ${data[atr][0]}`);
							}
						} else {
							throw Error(data.toString());
						}
					} else {
						throw Error("There was an error saving the syllabus");
					}
				}
				return await resp.json();
			},
			clear: () => {
				const store = getStore();
				localStorage.removeItem("syllabus-" + store.info.slug, JSON.stringify(store));
				setStore({
					days: [],
					report: [],
					info: {
						label: "",
						slug: "",
						version: "",
						profile: null,
						description: ""
					}
				});
			},
			pieces: function() {
				const store = getStore();
				return {
					in: (piece, day) => {
						this.pieces().delete(piece);
						this.days().update(day.id, day);
					},
					out: (piece, day) => {
						this.pieces().addOrReplace(piece);
						this.days().update(day.id, day);
					},
					addOrReplace: piece => {
						piece.type === "quiz"
							? setStore({
									[mapEntity[piece.type]]: store[mapEntity[piece.type]]
										.filter(p =>
											typeof piece.slug !== undefined
												? piece.slug !== p.info.slug
												: typeof piece.info.slug !== undefined
												? p.info.slug !== piece.info.slug
												: p.info.slug !== piece.data.info.slug
										)
										.concat(piece)
							  })
							: setStore({
									[mapEntity[piece.type]]: store[mapEntity[piece.type]].filter(p => p.slug !== piece.slug).concat(piece)
							  });
					},
					delete: piece => {
						piece.type === "quiz"
							? setStore({
									[mapEntity[piece.type]]: store[mapEntity[piece.type]].filter(p =>
										typeof piece.data.info.slug === undefined ? p.info.slug !== piece.slug : p.info.slug !== piece.data.info.slug
									)
							  })
							: setStore({
									[mapEntity[piece.type]]: store[mapEntity[piece.type]].filter(p => p.slug != piece.data.slug)
							  });
					}
				};
			},
			getApiSyllabus: async (academy, profile, version) => {
				const store = getStore();
				const meta = { academy_author: academy, profile, version, slug: profile };
				const _store = { ...store, info: { ...store.info, ...meta } };
				setStore(_store);

				// ignore version, academy or profile null
				if (
					!version ||
					version == "" ||
					version == "null" ||
					!academy ||
					academy == "" ||
					academy == "null" ||
					!profile ||
					profile == "" ||
					profile == "null"
				)
					return;

				const params = new URLSearchParams(window.location.search);
				const apiKey = params.get("token");
				const resp = await fetch(
					API.options.apiPathV2 + "/admissions/certificate/" + profile + "/academy/" + academy + "/syllabus/" + version,
					{
						headers: {
							//"Cache-Control": "no-cache",
							"Content-type": "application/json",
							Authorization: "Token " + apiKey
						}
					}
				);
				const data = await resp.text();
				const actions = getActions();
				if (resp.status < 200 || resp.status > 299) {
					if (resp.status > 399 && resp.status < 500) {
						throw Error(data.detail || data.details);
					} else {
						throw Error("There was an error fetching the syllabus");
					}
				}

				return await actions.upload({ content: data }, _store.info);
			},
			getApiSyllabusForNewDay: async (academy, profile, version) => {
<<<<<<< HEAD
				console.log(profile);
=======
>>>>>>> fc6aee55a75be68a8ff72c3b5f68b88a14ea8d3b
				// ignore version, academy or profile null
				if (
					!version ||
					version == "" ||
					version == "null" ||
					!academy ||
					academy == "" ||
					academy == "null" ||
					!profile ||
					profile == "" ||
					profile == "null"
				)
					return;

				const params = new URLSearchParams(window.location.search);
				const apiKey = params.get("token");
				const resp = await fetch(
					API.options.apiPathV2 + "/admissions/certificate/" + profile + "/academy/" + academy + "/syllabus/" + version,
					{
						headers: {
							//"Cache-Control": "no-cache",
							"Content-type": "application/json",
							Authorization: "Token " + apiKey
						}
					}
				);
				const data = await resp.text();
				const actions = getActions();
				if (resp.status < 200 || resp.status > 299) {
					if (resp.status > 399 && resp.status < 500) {
						throw Error(data.detail || data.details);
					} else {
						throw Error("There was an error fetching the syllabus");
					}
				}
				return await actions.import({ content: data });
			},
			getSyllabisVersions: async (academyId, courseSlug, readOnly = false) => {
				const store = getStore();
				const actions = getActions();
				const params = new URLSearchParams(window.location.search);
				const apiKey = params.get("token");
				const resp = await fetch(API.options.apiPathV2 + "/admissions/certificate/" + courseSlug + "/academy/" + academyId + "/syllabus", {
					headers: {
						"Content-type": "application/json",
						Authorization: "Token " + apiKey
					}
				});
				const data = await resp.json();
				if (resp.status < 200 || resp.status > 299) {
					if (resp.status > 399 && resp.status < 500) {
						throw Error(data.detail || data.details);
					} else {
						throw Error("There was an error saving the syllabus");
					}
				}
				console.log(data);
				if (!readOnly) setStore({ ...store, info: { ...store.info, academy_author: academyId, profile: courseSlug }, syllabus: data });
				else setStore({ imported_syllabus: data });
			},
			cleanSyllabus: async ({ academy = null, profile = null }) => {
				const store = getStore();
				setStore({
					...store,
					info: { ...defaultSyllabusInfo, academy_author: academy, profile },
					syllabus: profile ? store.syllabus : null,
					profiles: academy ? store.profiles : []
				});
			},
			days: () => {
				const store = getStore();
				const actions = getActions();
				return {
					add: (index = null, imported = []) => {
						if (!Array.isArray(imported) || imported.length === 0) imported = [newDay()];
						setStore({
							days: (() => {
								let _days = [];
								let extra = 0;
								for (let i = 0; i < store.days.length; i++) {
									if (index !== null && index + 1 == i) {
										imported.forEach(d => {
											extra += 1;
											_days.push(newDay(extra + i, extra + i, d));
										});
									}
									_days.push({ ...store.days[i], id: extra + i + 1, position: extra + i + 1 });
								}
								if (index === null || index + 1 === store.days.length) {
									let count = store.days.length;
									imported.forEach(d => {
										count += 1;
										_days.push(newDay(count, count, d));
									});
								}
								return _days;
							})()
						});
					},
					update: (id, day) => {
						const store = getStore();
						setStore({
							days: store.days.map(d => {
								if (d.id != id) return d;
								else return { ...d, ...day };
							})
						});
					},
					replacePiece: (piece, type) => {
						const store = getStore();
						for (let i = 0; i < store.days.length; i++) {
							const day = store.days[i];
							let _found = false;
							if (type === "quiz")
								_found = day[type].find(p =>
									typeof piece.data.info.slug === undefined ? p.info.slug === piece.slug : p.info.slug === piece.data.info.slug
								);
							else _found = day[type].find(p => p.slug === piece.data.slug);
							if (_found) return true;
						}
						return false;
					},
					findPiece: (piece, type) => {
						const store = getStore();

						for (let i = 0; i < store.days.length; i++) {
							const day = store.days[i];
							let _found = false;
							if (type === "quiz")
								_found = day[type].find(p =>
									typeof piece.data.info.slug === undefined ? p.info.slug === piece.slug : p.info.slug === piece.data.info.slug
								);
							else _found = day[type].find(p => p.slug === piece.data.slug);

							if (_found) return { found: true, day: { ..._found, id: day.id } };
						}
						return false;
					},
					delete: id => {
						const store = getStore();
						setStore({
							days: store.days
								.filter(d => d.id != id)
								// .sort((a, b) => (a.position < b.position ? -1 : 1))
								.map((d, i) => {
									return { ...d, position: i + 1 };
								})
						});
					}
				};
			}
		}
	};
};

export function injectContent(Child) {
	const StoreWrapper = props => {
		const [state, setState] = useState(
			getState({
				getStore: () => state.store,
				getActions: () => state.actions,
				setStore: updatedStore => {
					const currentStore = state.actions.getStore();
					const store = Object.assign(currentStore, updatedStore);
					setState({ store, actions: { ...state.actions } });
					localStorage.setItem("syllabus-" + store.info.slug, JSON.stringify(store));
				}
			})
		);
		useEffect(() => {
			const slug = window.location.hash.replace("#", "");
			const previousStore = localStorage.getItem("syllabus-" + slug);
			if (typeof previousStore === "string" && previousStore != "") {
				state.actions.setStore(JSON.parse(previousStore));
			}

			state.actions.fetch(["lesson", "quiz", "project", "replit", "technology"]);
			window.store = state.store;
		}, []);
		return (
			<ContentContext.Provider value={state}>
				<ToastProvider placement="bottom-right" autoDismiss={true}>
					<Child {...props} />
				</ToastProvider>
			</ContentContext.Provider>
		);
	};
	return StoreWrapper;
}
