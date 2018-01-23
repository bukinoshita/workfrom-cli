#!/usr/bin/env node
'use strict'

const meow = require('meow')
const updateNotifier = require('update-notifier')
const wer = require('wer')
const request = require('request-promise-native')
const shoutError = require('shout-error')
const shoutSuccess = require('shout-success')
const { gray } = require('chalk')
const ora = require('ora')

const rightPad = require('./lib/right-pad')

const cli = meow(
  `
 Usage:
   $ workfrom

 Example:
   $ workfrom
   $ workfrom -r=50

 Options:
   -r, --radius          Radius
   -h, --help            Show help options
   -v, --version         Show version
`,
  {
    alias: {
      r: 'radius',
      h: 'help',
      v: 'version'
    }
  }
)

updateNotifier({ pkg: cli.pkg }).notify()

const run = async () => {
  const hasRadius = cli.flags.r
  const { lat, long } = await wer()
  const radius = hasRadius || 10
  const spinner = ora(`Finding places to work ${radius} miles near you.`)

  try {
    spinner.start()
    const { meta, response } = JSON.parse(
      await request(
        `http://api.workfrom.co/places/ll/${lat},${long}&radius=${radius}`
      )
    )

    spinner.stop()

    if (meta.results.total === 0) {
      return shoutError(
        `We couldn't find any place to work ${radius} miles near you.`
      )
    }

    response.map(({ title, street, city, description, distance }) => {
      const log = `
${gray(rightPad('Name:', 12))} ${title}
${gray(rightPad('Street:', 12))} ${street}
${gray(rightPad('City:', 12))} ${city},
${gray(rightPad('Distance:', 12))} ${distance} miles
${gray(rightPad('Description:', 12))} ${description}
      `

      return console.log(log)
    })

    shoutSuccess(
      `We found ${meta.results.total} places to work ${radius} miles near you.`
    )
  } catch (err) {
    console.log(err)
  }
}

run(cli)
